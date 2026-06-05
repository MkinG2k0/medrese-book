import { endOfMonth, startOfMonth } from 'date-fns'

import { prisma } from '@/shared/lib/prisma'

const MONTH_FORMAT = /^\d{4}-\d{2}$/

export function parseAnalyticsMonth(month?: string): Date {
	if (month && MONTH_FORMAT.test(month)) {
		const [year, monthIndex] = month.split('-').map(Number)
		const parsed = new Date(year, monthIndex - 1, 1)
		if (!Number.isNaN(parsed.getTime())) return startOfMonth(parsed)
	}

	return startOfMonth(new Date())
}

export function formatAnalyticsMonth(month: Date): string {
	return new Intl.DateTimeFormat('ru-RU', {
		month: 'long',
		year: 'numeric',
	}).format(month)
}

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

export type LevelStats = {
	level: number
	avgGrade: number
	totalAbsences: number
	totalLateMinutes: number
	totalHours: number
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
				where: { createdAt: { gte: from, lte: to } },
			},
			sessions: {
				where: { date: { gte: from, lte: to } },
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

export async function getLevelStats(
	month: Date,
	teacherId?: string | null,
): Promise<LevelStats[]> {
	const from = startOfMonth(month)
	const to = endOfMonth(month)

	const levels = await prisma.level.findMany({
		include: {
			steps: true,
			groups: {
				where: teacherId ? { teacherId } : undefined,
				include: {
					students: {
						include: {
							completions: {
								where: { createdAt: { gte: from, lte: to } },
							},
							sessions: {
								where: { date: { gte: from, lte: to } },
							},
						},
					},
				},
			},
		},
	})

	return levels.map((level) => {
		const students = level.groups.flatMap((g) => g.students)
		const allCompletions = students.flatMap((s) => s.completions)
		const allSessions = students.flatMap((s) => s.sessions)

		const grades = allCompletions.map((c) => c.grade)
		const avgGrade =
			grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0

		const totalStepHours = level.steps.reduce((sum, step) => sum + step.hours, 0)
		const totalLateMinutes = sumLateMinutes(allSessions)
		const lateHours = totalLateMinutes / 60

		return {
			level: level.number,
			avgGrade: Math.round(avgGrade * 10) / 10,
			totalAbsences: allSessions.filter((s) => s.attendance === 'ABSENT').length,
			totalLateMinutes,
			totalHours: Math.round((totalStepHours - lateHours) * 10) / 10,
		}
	})
}
