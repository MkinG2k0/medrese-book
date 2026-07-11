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

function countAttendedSessions(sessions: { attendance: string }[]): number {
	return sessions.filter(
		(s) => s.attendance === 'PRESENT' || s.attendance === 'LATE',
	).length
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
	attendedSessions: number
}

export async function getTopStudents(
	month: Date,
	teacherId?: string | null,
	groupId?: string | null,
): Promise<TopEntry[]> {
	const from = startOfMonth(month)
	const to = endOfMonth(month)

	const students = await prisma.student.findMany({
		where: groupId
			? { enrollments: { some: { groupId } } }
			: teacherId
				? { enrollments: { some: { group: { teacherId } } } }
				: undefined,
		include: {
			user: true,
			completions: {
				where: {
					...analyticsCompletionFilter({ gte: from, lte: to }),
					...(groupId ? { session: { groupId } } : {}),
				},
			},
			sessions: {
				where: {
					...analyticsSessionFilter({ gte: from, lte: to }),
					...(groupId ? { groupId } : {}),
				},
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
				attendedSessions: countAttendedSessions(student.sessions),
			}
		})
		.sort((a, b) => b.stepsCompleted - a.stepsCompleted)
}
