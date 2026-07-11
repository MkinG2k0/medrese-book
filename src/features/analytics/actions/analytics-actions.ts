'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export async function getAnalyticsTeachers() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const teachers = await prisma.teacher.findMany({
		include: { user: true },
		orderBy: { user: { name: 'asc' } },
	})

	return teachers.map((teacher) => ({
		id: teacher.id,
		name: teacher.user.name,
	}))
}

export type AnalyticsGroupOption = {
	id: string
	name: string
	subjectName: string
}

export async function getAnalyticsGroupsByTeacher(
	teacherId: string,
): Promise<AnalyticsGroupOption[]> {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const groups = await prisma.group.findMany({
		where: { teacherId },
		include: { subject: { select: { name: true } } },
		orderBy: { name: 'asc' },
	})

	return groups.map((group) => ({
		id: group.id,
		name: group.name,
		subjectName: group.subject.name,
	}))
}
