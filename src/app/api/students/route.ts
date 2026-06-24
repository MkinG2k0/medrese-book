import {
	getCalendarDayQueryRange,
	isSameCalendarDay,
} from '@/shared/lib/calendar-date'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
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
			students: {
				include: {
					user: true,
					level: true,
					sessions: dayRange
						? {
								where: {
									date: { gte: dayRange.start, lte: dayRange.end },
								},
								orderBy: { date: 'desc' },
								include: { completions: true },
							}
						: false,
				},
			},
		},
	})

	if (!group) return error('Группа не найдена', 404)

	const students = group.students.map((s) => {
		const todaySession =
			dateStr && Array.isArray(s.sessions)
				? s.sessions.find((session) =>
						isSameCalendarDay(session.date, dateStr),
					)
				: undefined

		const completions =
			todaySession && 'completions' in todaySession
				? (todaySession.completions as { grade: number }[])
				: []

		return {
			id: s.id,
			name: s.user.name,
			currentStepIdx: s.currentStepIdx,
			groupId: s.groupId,
			levelNumber: s.level.number,
			levelTitle: s.level.title,
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
