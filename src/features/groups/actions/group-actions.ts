'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import {
	createGroupSchema,
	updateGroupSchema,
} from '@/shared/lib/validations/group'

const enrollmentInclude = {
	include: {
		student: { include: { user: true } },
		level: true,
	},
	orderBy: { student: { user: { name: 'asc' as const } } },
} as const

export async function getGroups() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.group.findMany({
		include: {
			teacher: { include: { user: true } },
			subject: true,
			_count: { select: { enrollments: true } },
		},
		orderBy: { name: 'asc' },
	})
}

export async function getMyGroup() {
	const session = await requireRoles(['TEACHER'])

	if (!session.user.teacherId) return null

	return prisma.group.findFirst({
		where: { teacherId: session.user.teacherId },
		include: {
			teacher: { include: { user: true } },
			subject: true,
			enrollments: enrollmentInclude,
		},
	})
}

export async function getGroup(groupId: string) {
	const session = await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			teacher: { include: { user: true } },
			subject: true,
			enrollments: enrollmentInclude,
		},
	})

	return { group, session }
}

export async function createGroup(input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = createGroupSchema.parse(input)

	const group = await prisma.group.create({ data })
	revalidatePath('/groups')
	revalidatePath('/my-group')
	return group
}

export async function updateGroup(groupId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = updateGroupSchema.parse(input)

	const existing = await prisma.group.findUnique({
		where: { id: groupId },
		select: { teacherId: true },
	})
	if (!existing) {
		throw new Error('Группа не найдена')
	}

	const group = await prisma.group.update({
		where: { id: groupId },
		data: { name: data.name, teacherId: data.teacherId },
	})
	revalidatePath('/groups')
	revalidatePath(`/groups/${groupId}`)
	revalidatePath('/my-group')
	revalidatePath('/journal')
	return group
}

export async function getTeachers() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.teacher.findMany({ include: { user: true } })
}
