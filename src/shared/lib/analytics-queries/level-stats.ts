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

function buildGroupScopeFilter(
	subjectId: string,
	teacherId?: string | null,
	groupId?: string | null,
) {
	return {
		subjectId,
		...(groupId ? { id: groupId } : {}),
		...(teacherId && !groupId ? { teacherId } : {}),
	}
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
	teacherId: string | null | undefined,
	groupId: string | null | undefined,
	subjectId: string,
): Promise<LevelStats[]> {
	const from = startOfMonth(month)
	const to = endOfMonth(month)
	const groupScope = buildGroupScopeFilter(subjectId, teacherId, groupId)

	const levels = await prisma.level.findMany({
		where: { subjectId },
		include: {
			steps: true,
			enrollments: {
				where: {
					group: groupScope,
				},
				include: {
					student: {
						include: {
							completions: {
								where: {
									...analyticsCompletionFilter({ gte: from, lte: to }),
									session: {
										group: groupScope,
									},
								},
							},
							sessions: {
								where: {
									...analyticsSessionFilter({ gte: from, lte: to }),
									group: groupScope,
								},
							},
						},
					},
				},
			},
		},
	})

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

		return {
			levelId: level.id,
			level: level.number,
			label: String(level.number),
			avgGrade: Math.round(avgGrade * 10) / 10,
			totalAbsences: allSessions.filter((s) => s.attendance === 'ABSENT').length,
			totalLateMinutes,
			totalHours: Math.round((totalStepHours - lateHours) * 10) / 10,
		}
	})
}
