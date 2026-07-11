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

export type LevelStats = {
	levelId: string
	level: number
	label: string
	avgGrade: number
	totalAbsences: number
	totalLateMinutes: number
	totalHours: number
}

export async function getLevelStats(
	month: Date,
	teacherId?: string | null,
	groupId?: string | null,
): Promise<LevelStats[]> {
	const from = startOfMonth(month)
	const to = endOfMonth(month)

	const groupSubjectId = groupId
		? (
				await prisma.group.findUnique({
					where: { id: groupId },
					select: { subjectId: true },
				})
			)?.subjectId
		: null

	const levels = await prisma.level.findMany({
		where: groupSubjectId ? { subjectId: groupSubjectId } : undefined,
		include: {
			subject: { select: { name: true } },
			steps: true,
			enrollments: {
				where: groupId
					? { groupId }
					: teacherId
						? { group: { teacherId } }
						: undefined,
				include: {
					student: {
						include: {
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
					},
				},
			},
		},
	})

	const hasMultipleSubjects =
		new Set(levels.map((level) => level.subjectId)).size > 1

	return levels.map((level) => {
		const enrolledStudents = level.enrollments.map(
			(enrollment) => enrollment.student,
		)
		const allCompletions = enrolledStudents.flatMap((s) => s.completions)
		const allSessions = enrolledStudents.flatMap((s) => s.sessions)

		const grades = allCompletions.map((c) => c.grade)
		const avgGrade =
			grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0

		const totalStepHours = level.steps.reduce((sum, step) => sum + step.hours, 0)
		const totalLateMinutes = sumLateMinutes(allSessions)
		const lateHours = totalLateMinutes / 60

		const label = hasMultipleSubjects
			? `${level.number} (${level.subject.name})`
			: String(level.number)

		return {
			levelId: level.id,
			level: level.number,
			label,
			avgGrade: Math.round(avgGrade * 10) / 10,
			totalAbsences: allSessions.filter((s) => s.attendance === 'ABSENT').length,
			totalLateMinutes,
			totalHours: Math.round((totalStepHours - lateHours) * 10) / 10,
		}
	})
}
