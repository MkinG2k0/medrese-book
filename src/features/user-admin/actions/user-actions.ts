'use server'

import { revalidatePath } from 'next/cache'

import { getDefaultLevelId } from '@/shared/lib/default-level'
import { generateUniqueCode } from '@/shared/lib/generate-unique-code'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import { syncCompletionsForProgress } from '@/shared/lib/sync-completions-for-progress'
import { getStepOffsetForLevel } from '@/shared/lib/step-offset'
import { createUsersSchema } from '@/shared/lib/validations/user'

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
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

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
