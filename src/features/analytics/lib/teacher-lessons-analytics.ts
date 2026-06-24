import {
	getCalendarRangeBounds,
	isCalendarRange,
	listCalendarDays,
} from '@/shared/lib/calendar-range'
import {
	getLocalDateString,
	isSameCalendarDay,
} from '@/shared/lib/calendar-date'
import { formatElapsedMs } from '@/features/journal/lib/format-elapsed'
import { getTeachingSessionDurationMs } from '@/features/journal/lib/teaching-session'
import {
	averageLocalTime,
	formatLocalTime,
} from '@/shared/lib/local-time'

export type TeacherLessonAnalyticsRow = {
	teacherId: string
	teacherName: string
	loginAt: string | null
	lessonStartedAt: string | null
	lessonEndedAt: string | null
	durationLabel: string
	isAverage: boolean
}

type TeacherRecord = {
	id: string
	userId: string
	name: string
}

type TeachingSessionRecord = {
	teacherId: string
	startedAt: Date
	endedAt: Date | null
	date: Date
}

type LoginRecord = {
	userId: string
	createdAt: Date
}

function formatDurationLabel(
	sessions: TeachingSessionRecord[],
	isAverage: boolean,
): string {
	const durations = sessions
		.map((session) => getTeachingSessionDurationMs(session))
		.filter((value): value is number => value != null && value > 0)

	if (durations.length === 0) return 'время не учтено'

	if (isAverage) {
		const avg =
			durations.reduce((sum, value) => sum + value, 0) / durations.length
		return formatElapsedMs(avg)
	}

	return formatElapsedMs(durations[0]!)
}

function formatTimeValue(
	times: Date[],
	isAverage: boolean,
): string | null {
	if (times.length === 0) return null
	return isAverage ? averageLocalTime(times) : formatLocalTime(times[0]!)
}

function sessionMatchesDay(
	session: TeachingSessionRecord,
	day: string,
): boolean {
	return (
		isSameCalendarDay(session.date, day) ||
		isSameCalendarDay(session.startedAt, day)
	)
}

function loginMatchesDay(login: LoginRecord, day: string): boolean {
	return isSameCalendarDay(login.createdAt, day)
}

function buildRowForTeacher(
	teacher: TeacherRecord,
	days: string[],
	sessions: TeachingSessionRecord[],
	logins: LoginRecord[],
	isAverage: boolean,
): TeacherLessonAnalyticsRow {
	const teacherSessions = sessions.filter(
		(session) => session.teacherId === teacher.id,
	)
	const teacherLogins = logins.filter((login) => login.userId === teacher.userId)

	if (isAverage) {
		const loginTimes = days.flatMap((day) => {
			const dayLogin = teacherLogins.find((login) => loginMatchesDay(login, day))
			return dayLogin ? [dayLogin.createdAt] : []
		})
		const startedTimes = days.flatMap((day) => {
			const daySession = teacherSessions.find((session) =>
				sessionMatchesDay(session, day),
			)
			return daySession ? [daySession.startedAt] : []
		})
		const endedTimes = days.flatMap((day) => {
			const daySession = teacherSessions.find(
				(session) => sessionMatchesDay(session, day) && session.endedAt,
			)
			return daySession?.endedAt ? [daySession.endedAt] : []
		})
		const completedSessions = teacherSessions.filter(
			(session) =>
				session.endedAt != null &&
				days.some((day) => sessionMatchesDay(session, day)),
		)

		return {
			teacherId: teacher.id,
			teacherName: teacher.name,
			loginAt: formatTimeValue(loginTimes, true),
			lessonStartedAt: formatTimeValue(startedTimes, true),
			lessonEndedAt: formatTimeValue(endedTimes, true),
			durationLabel: formatDurationLabel(completedSessions, true),
			isAverage: true,
		}
	}

	const day = days[0]!
	const dayLogin = teacherLogins.find((login) => loginMatchesDay(login, day))
	const daySession = teacherSessions.find((session) =>
		sessionMatchesDay(session, day),
	)

	return {
		teacherId: teacher.id,
		teacherName: teacher.name,
		loginAt: dayLogin ? formatLocalTime(dayLogin.createdAt) : null,
		lessonStartedAt: daySession
			? formatLocalTime(daySession.startedAt)
			: null,
		lessonEndedAt: daySession?.endedAt
			? formatLocalTime(daySession.endedAt)
			: null,
		durationLabel: daySession
			? formatDurationLabel([daySession], false)
			: 'время не учтено',
		isAverage: false,
	}
}

export function buildTeacherLessonAnalyticsRows(
	teachers: TeacherRecord[],
	sessions: TeachingSessionRecord[],
	logins: LoginRecord[],
	from: string,
	to: string,
): TeacherLessonAnalyticsRow[] {
	const days = listCalendarDays(from, to)
	const isAverage = isCalendarRange(from, to)

	return teachers.map((teacher) =>
		buildRowForTeacher(teacher, days, sessions, logins, isAverage),
	)
}

export function parseTeacherLessonsDateRange(
	fromParam?: string,
	toParam?: string,
): { from: string; to: string } {
	const today = getLocalDateString()
	const from =
		fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : today
	const to = toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam) ? toParam : from
	return { from: from <= to ? from : to, to: from <= to ? to : from }
}

export function getTeacherLessonsQueryBounds(from: string, to: string) {
	return getCalendarRangeBounds(from, to)
}
