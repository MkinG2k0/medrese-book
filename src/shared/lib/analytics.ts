import { endOfMonth, startOfMonth } from 'date-fns'

import { prisma } from '@/shared/lib/prisma'

export type TopEntry = {
	student: { id: string; name: string }
	stepsCompleted: number
	avgGrade: number
	absences: number
}

export type LevelStats = {
	level: number
	avgGrade: number
	totalAbsences: number
	totalHours: number
}

export async function getTopStudents(month: Date): Promise<TopEntry[]> {
	const from = startOfMonth(month)
	const to = endOfMonth(month)

	const students = await prisma.student.findMany({
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
			}
		})
		.sort((a, b) => b.stepsCompleted - a.stepsCompleted)
		.slice(0, 10)
}

export async function getLevelStats(): Promise<LevelStats[]> {
	const levels = await prisma.level.findMany({
		include: {
			steps: true,
			groups: {
				include: {
					students: {
						include: {
							completions: true,
							sessions: true,
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
		const lateHours =
			allSessions.reduce((sum, s) => sum + (s.lateMinutes ?? 0), 0) / 60

		return {
			level: level.number,
			avgGrade: Math.round(avgGrade * 10) / 10,
			totalAbsences: allSessions.filter((s) => s.attendance === 'ABSENT').length,
			totalHours: Math.round((totalStepHours - lateHours) * 10) / 10,
		}
	})
}
