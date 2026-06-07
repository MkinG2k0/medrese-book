'use server'

import { revalidatePath } from 'next/cache'

import { getDefaultLevelId } from '@/shared/lib/default-level'
import { generateUniqueCode } from '@/shared/lib/generate-unique-code'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import { createUsersSchema } from '@/shared/lib/validations/user'

export async function getUsers() {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	return prisma.user.findMany({
		include: {
			teacher: { include: { groups: true } },
			student: { include: { group: true } },
		},
		orderBy: { createdAt: 'desc' },
	})
}

export async function createUsers(input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const data = createUsersSchema.parse(input)
	const defaultLevelId =
		data.role === 'STUDENT' ? await getDefaultLevelId() : undefined

	const users: { name: string; code: string }[] = []

	for (const name of data.names) {
		const code = await generateUniqueCode()

		await prisma.user.create({
			data: {
				name,
				code,
				role: data.role,
				...(data.role === 'TEACHER' && {
					teacher: { create: {} },
				}),
				...(data.role === 'STUDENT' && {
					student: {
						create: {
							groupId: data.groupId!,
							levelId: defaultLevelId!,
						},
					},
				}),
			},
		})

		users.push({ name, code })
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
