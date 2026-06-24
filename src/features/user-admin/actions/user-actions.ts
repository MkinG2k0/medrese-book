'use server'

import { revalidatePath } from 'next/cache'

import { getDefaultLevelId } from '@/shared/lib/default-level'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { generateUniqueCode } from '@/shared/lib/generate-unique-code'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import {
	getStepOffsetForLevel,
	syncCompletionsForProgress,
} from '@/shared/lib/student-progress'
import {
	createUsersSchema,
	updateStaffUserSchema,
	updateStudentUserSchema,
} from '@/shared/lib/validations/user'

export async function getUsers() {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	return prisma.user.findMany({
		include: {
			teacher: { include: { groups: true } },
			student: { include: { group: true, level: true } },
		},
		orderBy: { createdAt: 'desc' },
	})
}

export async function getLevelsForCreateUser() {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	return prisma.level.findMany({
		include: { steps: { orderBy: { order: 'asc' } } },
		orderBy: { number: 'asc' },
	})
}

export async function createUsers(input: unknown) {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const data = createUsersSchema.parse(input)

	let level:
		| {
				id: string
				number: number
				steps: { id: string }[]
		  }
		| undefined

	if (data.role === 'STUDENT') {
		const levelId = data.levelId ?? (await getDefaultLevelId())
		const foundLevel = await prisma.level.findUnique({
			where: { id: levelId },
			include: { steps: { orderBy: { order: 'asc' } } },
		})

		if (!foundLevel) {
			throw new Error('Уровень не найден')
		}

		const localStepIndex = data.localStepIndex ?? 0
		if (localStepIndex > foundLevel.steps.length) {
			throw new Error('Шаг выходит за пределы уровня')
		}

		level = foundLevel
	}

	const users: { name: string; code: string }[] = []

	for (const entry of data.entries) {
		const code = await generateUniqueCode()

		if (data.role === 'STUDENT' && level) {
			const localStepIndex = data.localStepIndex ?? 0
			const stepOffset = await getStepOffsetForLevel(level.number)
			const currentStepIdx = stepOffset + localStepIndex

			const createdStudent = await prisma.$transaction(async (tx) => {
				const user = await tx.user.create({
					data: {
						name: entry.name,
						code,
						role: data.role,
						student: {
							create: {
								fullName: entry.fullName ?? entry.name,
								phone: entry.phone,
								guardianPhone: entry.guardianPhone,
								groupId: data.groupId!,
								levelId: level.id,
								currentStepIdx,
							},
						},
					},
					include: { student: true },
				})

				await syncCompletionsForProgress(
					tx,
					user.student!.id,
					level.steps,
					localStepIndex,
				)

				await dispatchDomainEvent(
					{
						actorId: session.user.id,
						action: 'STUDENT_CREATED',
						entityType: 'Student',
						entityId: user.student!.id,
						payload: {
							userId: user.id,
							levelId: level.id,
							currentStepIdx,
							localStepIndex,
							groupId: data.groupId,
						},
					},
					tx,
				)

				return user
			})

			users.push({ name: createdStudent.name, code: createdStudent.code })
			continue
		}

		await prisma.user.create({
			data: {
				name: entry.name,
				code,
				role: data.role,
				phone: data.phone,
				...(data.role === 'TEACHER' && {
					teacher: { create: {} },
				}),
			},
		})

		users.push({ name: entry.name, code })
	}

	revalidatePath('/admin/users')
	return { users }
}

export async function updateUser(userId: string, input: unknown) {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { student: true },
	})

	if (!user) {
		throw new Error('Пользователь не найден')
	}

	if (user.role === 'STUDENT' && user.student) {
		const data = updateStudentUserSchema.parse(input)

		const level = await prisma.level.findUnique({
			where: { id: data.levelId },
			include: { steps: { orderBy: { order: 'asc' } } },
		})

		if (!level) {
			throw new Error('Уровень не найден')
		}

		if (data.localStepIndex > level.steps.length) {
			throw new Error('Шаг выходит за пределы уровня')
		}

		const previousGroupId = user.student.groupId
		const previousLevelId = user.student.levelId
		const previousStepIdx = user.student.currentStepIdx
		const stepOffset = await getStepOffsetForLevel(level.number)
		const currentStepIdx = stepOffset + data.localStepIndex

		await prisma.$transaction(async (tx) => {
			await syncCompletionsForProgress(
				tx,
				user.student!.id,
				level.steps,
				data.localStepIndex,
			)

			await tx.student.update({
				where: { id: user.student!.id },
				data: {
					fullName: data.name,
					phone: data.phone,
					guardianPhone: data.guardianPhone,
					groupId: data.groupId,
					levelId: data.levelId,
					currentStepIdx,
				},
			})

			await tx.user.update({
				where: { id: userId },
				data: { name: data.name },
			})

			await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'STUDENT_UPDATED',
					entityType: 'Student',
					entityId: user.student!.id,
					payload: {
						userId,
						previousGroupId,
						previousLevelId,
						previousStepIdx,
						groupId: data.groupId,
						levelId: data.levelId,
						currentStepIdx,
						localStepIndex: data.localStepIndex,
					},
				},
				tx,
			)
		})

		revalidatePath('/admin/users')
		revalidatePath('/groups')
		revalidatePath(`/groups/${data.groupId}`)
		if (previousGroupId !== data.groupId) {
			revalidatePath(`/groups/${previousGroupId}`)
		}
		revalidatePath('/journal')
		revalidatePath(`/journal/${user.student.id}`)
		revalidatePath(`/students/${user.student.id}/edit`)
		revalidatePath('/student/me')
		return
	}

	const data = updateStaffUserSchema.parse(input)

	await prisma.user.update({
		where: { id: userId },
		data: {
			name: data.name,
			phone: data.phone,
		},
	})

	revalidatePath('/admin/users')
}

export async function resetUserCode(userId: string) {
	await requireRoles(['SUPER_ADMIN'])

	const code = await generateUniqueCode()
	await prisma.user.update({
		where: { id: userId },
		data: { code },
	})

	revalidatePath('/admin/users')
	return { code }
}
