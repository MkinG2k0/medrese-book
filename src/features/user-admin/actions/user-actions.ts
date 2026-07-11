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
		where: { role: { not: 'SUPER_ADMIN' } },
		include: {
			teacher: { include: { groups: true } },
			student: {
				include: {
					enrollments: {
						include: {
							group: true,
							level: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: 'desc' },
	})
}

export async function getLevelsWithStepsForSubject(subjectId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	return prisma.level.findMany({
		where: { subjectId },
		include: { steps: { orderBy: { order: 'asc' } } },
		orderBy: { number: 'asc' },
	})
}

export async function getLevelsForStudentProfile() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

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
		const group = await prisma.group.findUnique({
			where: { id: data.groupId! },
			select: { subjectId: true },
		})

		if (!group) {
			throw new Error('Группа не найдена')
		}

		const foundLevel = await prisma.level.findFirst({
			where: { id: levelId, subjectId: group.subjectId },
			include: { steps: { orderBy: { order: 'asc' } } },
		})

		if (!foundLevel) {
			throw new Error('Уровень не принадлежит предмету группы')
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
								guardianName: entry.guardianName,
								guardianPhone: entry.guardianPhone,
								currentStepIdx,
							},
						},
					},
					include: { student: true },
				})

				await tx.groupEnrollment.create({
					data: {
						studentId: user.student!.id,
						groupId: data.groupId!,
						levelId: level.id,
					},
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
			revalidatePath(`/groups/${data.groupId}`)
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
	revalidatePath('/groups')
	revalidatePath('/journal')
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

		const enrollment = await prisma.groupEnrollment.findFirst({
			where: { studentId: user.student.id },
			include: {
				level: {
					include: { steps: { orderBy: { order: 'asc' } } },
				},
			},
			orderBy: { enrolledAt: 'asc' },
		})

		if (!enrollment) {
			throw new Error('Ученик не зачислен ни в одну группу')
		}

		const level = enrollment.level

		if (data.localStepIndex > level.steps.length) {
			throw new Error('Шаг выходит за пределы уровня')
		}

		const previousStepIdx = user.student.currentStepIdx
		const stepOffset = await getStepOffsetForLevel(level.number)
		const currentStepIdx = stepOffset + data.localStepIndex

		const enrollments = await prisma.groupEnrollment.findMany({
			where: { studentId: user.student.id },
			select: { groupId: true },
		})

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
					guardianName: data.guardianName,
					guardianPhone: data.guardianPhone,
					currentStepIdx,
					status: data.status,
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
						previousLevelId: enrollment.levelId,
						previousStepIdx,
						levelId: enrollment.levelId,
						currentStepIdx,
						localStepIndex: data.localStepIndex,
						status: data.status,
					},
				},
				tx,
			)
		})

		revalidatePath('/admin/users')
		revalidatePath('/groups')
		revalidatePath('/my-group')
		for (const { groupId } of enrollments) {
			revalidatePath(`/groups/${groupId}`)
		}
		revalidatePath('/journal')
		revalidatePath(`/journal/${user.student.id}`)
		revalidatePath(`/students/${user.student.id}/edit`)
		revalidatePath('/student/me')
		revalidatePath('/student/lessons')
		revalidatePath('/student/history')
		revalidatePath('/student/awards')
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

export async function deleteUser(userId: string) {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			teacher: { include: { groups: true } },
			student: true,
		},
	})

	if (!user) {
		throw new Error('Пользователь не найден')
	}

	if (user.role === 'SUPER_ADMIN') {
		throw new Error('Нельзя удалить супер-админа')
	}

	if (user.id === session.user.id) {
		throw new Error('Нельзя удалить собственную учётную запись')
	}

	if (user.role === 'TEACHER' && user.teacher) {
		if (user.teacher.groups.length > 0) {
			throw new Error(
				'Нельзя удалить учителя с группами. Сначала переназначьте группы другому учителю.',
			)
		}

		const teacherId = user.teacher.id

		await prisma.$transaction(async (tx) => {
			await tx.leaveRequest.updateMany({
				where: { substituteTeacherId: teacherId },
				data: { substituteTeacherId: null },
			})
			await tx.leaveRequest.deleteMany({ where: { teacherId } })
			await tx.substitution.deleteMany({
				where: {
					OR: [
						{ absentTeacherId: teacherId },
						{ substituteTeacherId: teacherId },
					],
				},
			})
			await tx.teachingSession.deleteMany({ where: { teacherId } })
			await tx.user.delete({ where: { id: userId } })
		})
	} else {
		const studentId = user.student?.id
		const enrollmentGroupIds =
			user.student
				? (
						await prisma.groupEnrollment.findMany({
							where: { studentId: user.student.id },
							select: { groupId: true },
						})
					).map((enrollment) => enrollment.groupId)
				: []

		await prisma.user.delete({ where: { id: userId } })

		if (studentId) {
			revalidatePath('/groups')
			revalidatePath('/my-group')
			for (const groupId of enrollmentGroupIds) {
				revalidatePath(`/groups/${groupId}`)
			}
			revalidatePath('/journal')
			revalidatePath(`/journal/${studentId}`)
		}
	}

	revalidatePath('/admin/users')
}
