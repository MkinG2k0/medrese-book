import {
	getCalendarDayQueryRange,
	isSameCalendarDay,
} from '@/shared/lib/calendar-date'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { isJournalVisibleStatus } from '@/shared/lib/student-status'
import { isStepPassed } from '@/shared/lib/step-completion'
import { error, success } from '@/shared/api'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const groupId = searchParams.get('groupId')
	const dateStr = searchParams.get('date')

	if (!groupId) return error('groupId обязателен')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
		context: { groupId },
	})
	if ('error' in authResult) return authResult.error

	const dayRange = dateStr ? getCalendarDayQueryRange(dateStr) : null

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			enrollments: {
				include: {
					student: {
						include: {
							user: true,
							sessions: dayRange
								? {
										where: {
											groupId,
											date: { gte: dayRange.start, lte: dayRange.end },
										},
										orderBy: { date: 'desc' },
										include: { completions: true },
									}
								: false,
						},
					},
					level: true,
				},
			},
		},
	})

	if (!group) return error('Группа не найдена', 404)

	const students = group.enrollments
		.filter((enrollment) => isJournalVisibleStatus(enrollment.student.status))
		.map((enrollment) => {
			const student = enrollment.student
			const todaySession =
				dateStr && Array.isArray(student.sessions)
					? student.sessions.find((session) =>
							isSameCalendarDay(session.date, dateStr),
						)
					: undefined

			const completions =
				todaySession && 'completions' in todaySession
					? (todaySession.completions as { grade: number }[])
					: []

			return {
				id: student.id,
				name: student.user.name,
				status: student.status,
				currentStepIdx: enrollment.currentStepIdx,
				groupId: enrollment.groupId,
				levelNumber: enrollment.level.number,
				levelTitle: enrollment.level.title,
				hasSessionToday: !!todaySession,
				todayAttendance: todaySession?.attendance ?? null,
				todayStepsCompleted: completions.filter((c) =>
					isStepPassed(c.grade),
				).length,
				todayGrades: completions.map((c) => c.grade),
			}
		})

	return success(students)
}
