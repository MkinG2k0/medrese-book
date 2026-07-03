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
	logoutAt: string | null
	lessonStartedAt: string | null
	lessonEndedAt: string | null
	lessonDurationLabel: string
	workplaceDurationLabel: string
	isAverage: boolean
	loginEventId: string | null
	logoutEventId: string | null
	teachingSessionId: string | null
}

type TeacherRecord = {
	id: string
	userId: string
	name: string
}

type TeachingSessionRecord = {
	id: string
	teacherId: string
	startedAt: Date
	endedAt: Date | null
	date: Date
}

type AuditTimeRecord = {
	id: string
	userId: string
	createdAt: Date
}

function formatLessonDurationLabel(
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

function formatWorkplaceDurationLabel(
	logins: AuditTimeRecord[],
	logouts: AuditTimeRecord[],
	days: string[],
	isAverage: boolean,
): string {
	const durations = days.flatMap((day) => {
		const login = logins.find((record) => auditTimeMatchesDay(record, day))
		const logout = findLastAuditTimeForDay(logouts, day)
		if (!login || !logout) return []

		const ms = logout.createdAt.getTime() - login.createdAt.getTime()
		return ms > 0 ? [ms] : []
	})

	if (durations.length === 0) return 'время не учтено'

	if (isAverage) {
		const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length
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

function auditTimeMatchesDay(record: AuditTimeRecord, day: string): boolean {
	return isSameCalendarDay(record.createdAt, day)
}

function findLastAuditTimeForDay(
	records: AuditTimeRecord[],
	day: string,
): AuditTimeRecord | undefined {
	let last: AuditTimeRecord | undefined
	for (const record of records) {
		if (auditTimeMatchesDay(record, day)) {
			last = record
		}
	}
	return last
}

function buildRowForTeacher(
	teacher: TeacherRecord,
	days: string[],
	sessions: TeachingSessionRecord[],
	logins: AuditTimeRecord[],
	logouts: AuditTimeRecord[],
	isAverage: boolean,
): TeacherLessonAnalyticsRow {
	const teacherSessions = sessions.filter(
		(session) => session.teacherId === teacher.id,
	)
	const teacherLogins = logins.filter((login) => login.userId === teacher.userId)
	const teacherLogouts = logouts.filter(
		(logout) => logout.userId === teacher.userId,
	)

	if (isAverage) {
		const loginTimes = days.flatMap((day) => {
			const dayLogin = teacherLogins.find((login) =>
				auditTimeMatchesDay(login, day),
			)
			return dayLogin ? [dayLogin.createdAt] : []
		})
		const logoutTimes = days.flatMap((day) => {
			const dayLogout = findLastAuditTimeForDay(teacherLogouts, day)
			return dayLogout ? [dayLogout.createdAt] : []
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
			logoutAt: formatTimeValue(logoutTimes, true),
			lessonStartedAt: formatTimeValue(startedTimes, true),
			lessonEndedAt: formatTimeValue(endedTimes, true),
			lessonDurationLabel: formatLessonDurationLabel(completedSessions, true),
			workplaceDurationLabel: formatWorkplaceDurationLabel(
				teacherLogins,
				teacherLogouts,
				days,
				true,
			),
			isAverage: true,
			loginEventId: null,
			logoutEventId: null,
			teachingSessionId: null,
		}
	}

	const day = days[0]!
	const dayLogin = teacherLogins.find((login) => auditTimeMatchesDay(login, day))
	const dayLogout = findLastAuditTimeForDay(teacherLogouts, day)
	const daySession = teacherSessions.find((session) =>
		sessionMatchesDay(session, day),
	)

	return {
		teacherId: teacher.id,
		teacherName: teacher.name,
		loginAt: dayLogin ? formatLocalTime(dayLogin.createdAt) : null,
		logoutAt: dayLogout ? formatLocalTime(dayLogout.createdAt) : null,
		lessonStartedAt: daySession
			? formatLocalTime(daySession.startedAt)
			: null,
		lessonEndedAt: daySession?.endedAt
			? formatLocalTime(daySession.endedAt)
			: null,
		lessonDurationLabel: daySession
			? formatLessonDurationLabel([daySession], false)
			: 'время не учтено',
		workplaceDurationLabel: formatWorkplaceDurationLabel(
			teacherLogins,
			teacherLogouts,
			days,
			false,
		),
		isAverage: false,
		loginEventId: dayLogin?.id ?? null,
		logoutEventId: dayLogout?.id ?? null,
		teachingSessionId: daySession?.id ?? null,
	}
}

export function buildTeacherLessonAnalyticsRows(
	teachers: TeacherRecord[],
	sessions: TeachingSessionRecord[],
	logins: AuditTimeRecord[],
	logouts: AuditTimeRecord[],
	from: string,
	to: string,
): TeacherLessonAnalyticsRow[] {
	const days = listCalendarDays(from, to)
	const isAverage = isCalendarRange(from, to)

	return teachers.map((teacher) =>
		buildRowForTeacher(
			teacher,
			days,
			sessions,
			logins,
			logouts,
			isAverage,
		),
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
