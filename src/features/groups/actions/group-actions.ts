'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

const createGroupSchema = z.object({
	name: z.string().min(1),
	teacherId: z.string(),
})

export async function getGroups() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	return prisma.group.findMany({
		include: {
			teacher: { include: { user: true } },
			_count: { select: { students: true } },
		},
		orderBy: { name: 'asc' },
	})
}

export async function getGroup(groupId: string) {
	const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			teacher: { include: { user: true } },
			students: {
				include: {
					user: true,
					level: true,
				},
			},
		},
	})

	return { group, session }
}

export async function createGroup(input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = createGroupSchema.parse(input)

	const group = await prisma.group.create({ data })
	revalidatePath('/groups')
	revalidatePath('/admin/groups')
	return group
}

export async function getTeachers() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.teacher.findMany({ include: { user: true } })
}
