'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export type AnalyticsSubjectOption = {
	id: string
	name: string
}

export async function getAnalyticsSubjects(): Promise<AnalyticsSubjectOption[]> {
	const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	if (session.user.role === 'MANAGER' || session.user.role === 'SUPER_ADMIN') {
		return prisma.subject.findMany({
			select: { id: true, name: true },
			orderBy: { name: 'asc' },
		})
	}

	const teacherId = session.user.teacherId
	if (!teacherId) return []

	const groups = await prisma.group.findMany({
		where: { teacherId },
		select: {
			subject: { select: { id: true, name: true } },
		},
	})

	const byId = new Map<string, AnalyticsSubjectOption>()
	for (const group of groups) {
		byId.set(group.subject.id, {
			id: group.subject.id,
			name: group.subject.name,
		})
	}

	return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

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
	subjectId: string
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
		subjectId: group.subjectId,
		subjectName: group.subject.name,
	}))
}
