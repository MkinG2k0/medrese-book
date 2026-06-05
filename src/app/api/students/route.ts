import { auth } from '@/shared/lib/auth'
import {
	getCalendarDayQueryRange,
	isSameCalendarDay,
} from '@/shared/lib/calendar-date'
import { prisma } from '@/shared/lib/prisma'
import { error, forbidden, success, unauthorized } from '@/shared/api'

export async function GET(request: Request) {
	const session = await auth()
	if (!session) return unauthorized()

	const { searchParams } = new URL(request.url)
	const groupId = searchParams.get('groupId')
	const dateStr = searchParams.get('date')

	if (!groupId) return error('groupId обязателен')

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			students: {
				include: {
					user: true,
					...(dateStr
						? {
								sessions: {
									where: {
										date: (() => {
											const { start, end } =
												getCalendarDayQueryRange(dateStr)
											return { gte: start, lte: end }
										})(),
									},
									orderBy: { date: 'desc' },
									include: { completions: true },
								},
							}
						: {}),
				},
			},
		},
	})

	if (!group) return error('Группа не найдена', 404)

	if (
		session.user.role === 'TEACHER' &&
		session.user.teacherId !== group.teacherId
	) {
		return forbidden()
	}

	const students = group.students.map((s) => {
		const sessionsForDay =
			dateStr && 'sessions' in s
				? (
						s as typeof s & {
							sessions: {
								date: Date
								attendance: 'PRESENT' | 'LATE' | 'ABSENT'
								completions: { grade: number }[]
							}[]
						}
					).sessions.filter((session) =>
						isSameCalendarDay(session.date, dateStr),
					)
				: []

		const todaySession = sessionsForDay[0]

		return {
			id: s.id,
			name: s.user.name,
			currentStepIdx: s.currentStepIdx,
			groupId: s.groupId,
			hasSessionToday: !!todaySession,
			todayAttendance: todaySession?.attendance ?? null,
			todayStepsCompleted: todaySession?.completions.length ?? 0,
			todayGrades: todaySession?.completions.map((c) => c.grade) ?? [],
		}
	})

	return success(students)
}
