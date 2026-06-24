import { endOfMonth, startOfMonth } from 'date-fns'

import { prisma } from '@/shared/lib/prisma'

import {
	analyticsCompletionFilter,
	analyticsSessionFilter,
} from './filters'

type SessionWithLateness = {
	attendance: string
	lateMinutes: number | null
}

function sumLateMinutes(sessions: SessionWithLateness[]): number {
	return sessions
		.filter((s) => s.attendance === 'LATE')
		.reduce((sum, s) => sum + (s.lateMinutes ?? 0), 0)
}

export type TopEntry = {
	student: { id: string; name: string }
	stepsCompleted: number
	avgGrade: number
	absences: number
	lateMinutes: number
}

export async function getTopStudents(
	month: Date,
	teacherId?: string | null,
): Promise<TopEntry[]> {
	const from = startOfMonth(month)
	const to = endOfMonth(month)

	const students = await prisma.student.findMany({
		where: teacherId ? { group: { teacherId } } : undefined,
		include: {
			user: true,
			completions: {
				where: analyticsCompletionFilter({ gte: from, lte: to }),
			},
			sessions: {
				where: analyticsSessionFilter({ gte: from, lte: to }),
			},
		},
	})

	return students
		.map((student) => {
			const grades = student.completions.map((c) => c.grade)
			const avgGrade =
				grades.length > 0
					? grades.reduce((a, b) => a + b, 0) / grades.length
					: 0

			return {
				student: { id: student.id, name: student.user.name },
				stepsCompleted: student.completions.length,
				avgGrade: Math.round(avgGrade * 10) / 10,
				absences: student.sessions.filter((s) => s.attendance === 'ABSENT').length,
				lateMinutes: sumLateMinutes(student.sessions),
			}
		})
		.sort((a, b) => b.stepsCompleted - a.stepsCompleted)
}
