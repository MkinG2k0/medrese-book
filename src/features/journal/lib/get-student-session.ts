import {
	getCalendarDayQueryRange,
	isSameCalendarDay,
} from '@/shared/lib/calendar-date'
import { prisma } from '@/shared/lib/prisma'
import type { Attendance } from '@/shared/lib/prisma'

export type DaySessionRecord = {
	id: string
	studentId: string
	date: Date
	attendance: Attendance
	lateMinutes: number | null
	note: string | null
	completions: { stepId: string; grade: number; note: string | null }[]
}

export async function findStudentSessionForDay(
	studentId: string,
	dateStr: string,
): Promise<DaySessionRecord | null> {
	const dayRange = getCalendarDayQueryRange(dateStr)
	const daySessions = await prisma.session.findMany({
		where: {
			studentId,
			date: { gte: dayRange.start, lte: dayRange.end },
		},
		select: {
			id: true,
			studentId: true,
			date: true,
			attendance: true,
			lateMinutes: true,
			note: true,
			completions: {
				select: { stepId: true, grade: true, note: true },
			},
		},
		orderBy: { date: 'desc' },
	})

	return (
		daySessions.find((session) => isSameCalendarDay(session.date, dateStr)) ??
		null
	)
}

export function serializeDaySession(session: DaySessionRecord) {
	return {
		id: session.id,
		studentId: session.studentId,
		date: session.date.toISOString(),
		attendance: session.attendance,
		lateMinutes: session.lateMinutes,
		note: session.note,
		completions: session.completions,
	}
}

export type ClientDaySession = ReturnType<typeof serializeDaySession>
