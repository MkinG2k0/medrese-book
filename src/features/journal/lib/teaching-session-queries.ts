import {
	getCalendarDayQueryRange,
	isSameCalendarDay,
	toSessionDate,
} from '@/shared/lib/calendar-date'
import { prisma } from '@/shared/lib/prisma'

function isTeachingSessionOnCalendarDay(
	session: { date: Date; startedAt: Date },
	calendarDay: string,
) {
	return (
		isSameCalendarDay(session.date, calendarDay) ||
		isSameCalendarDay(session.startedAt, calendarDay)
	)
}

export async function findTeachingSessionForDay(
	teacherId: string,
	groupId: string,
	calendarDay: string,
) {
	const dayRange = getCalendarDayQueryRange(calendarDay)
	const sessions = await prisma.teachingSession.findMany({
		where: {
			teacherId,
			groupId,
			OR: [
				{ date: { gte: dayRange.start, lte: dayRange.end } },
				{ startedAt: { gte: dayRange.start, lte: dayRange.end } },
			],
		},
		orderBy: { startedAt: 'desc' },
	})

	return (
		sessions.find((session) =>
			isTeachingSessionOnCalendarDay(session, calendarDay),
		) ?? null
	)
}

export async function findActiveTeachingSession(teacherId: string) {
	return prisma.teachingSession.findFirst({
		where: {
			teacherId,
			endedAt: null,
		},
		orderBy: { startedAt: 'desc' },
	})
}

export async function endTeachingSessionById(
	sessionId: string,
	endedAt: Date = new Date(),
) {
	return prisma.teachingSession.update({
		where: { id: sessionId },
		data: { endedAt },
	})
}

export async function endActiveTeachingSessions(
	teacherId: string,
	endedAt: Date = new Date(),
) {
	const active = await findActiveTeachingSession(teacherId)
	if (!active) return null

	return endTeachingSessionById(active.id, endedAt)
}

export function teachingSessionDate(calendarDay: string): Date {
	return toSessionDate(calendarDay)
}
