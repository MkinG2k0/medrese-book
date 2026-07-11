'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export type ProgramLevelWithSteps = {
	id: string
	number: number
	title: string
	steps: { id: string; order: number; title: string; levelId: string }[]
}

export type ExtraAssignmentSubjectOption = {
	id: string
	name: string
}

export async function getProgramStepsForExtraAssignments(
	subjectId: string,
): Promise<ProgramLevelWithSteps[]> {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const levels = await prisma.level.findMany({
		where: { subjectId },
		orderBy: { number: 'asc' },
		include: {
			steps: {
				orderBy: { order: 'asc' },
				select: { id: true, order: true, title: true, levelId: true },
			},
		},
	})

	return levels.map((level) => ({
		id: level.id,
		number: level.number,
		title: level.title,
		steps: level.steps,
	}))
}

export async function getExtraAssignmentSubjects(): Promise<
	ExtraAssignmentSubjectOption[]
> {
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

	const byId = new Map<string, ExtraAssignmentSubjectOption>()
	for (const group of groups) {
		byId.set(group.subject.id, {
			id: group.subject.id,
			name: group.subject.name,
		})
	}

	return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}
