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
import { formatMoney } from '@/shared/lib/money'

export type TeacherLessonSubjectRow = {
	teacherId: string
	groupId: string
	groupName: string
	subjectName: string
	lessonStartedAt: string | null
	lessonEndedAt: string | null
	lessonDurationLabel: string
	earnedKopecks: number
	earnedLabel: string
	teachingSessionId: string | null
	isAverage: boolean
}

export type TeacherLessonAnalyticsRow = {
	teacherId: string
	teacherName: string
	loginAt: string | null
	logoutAt: string | null
	totalLessonDurationLabel: string
	workplaceDurationLabel: string
	earnedKopecks: number
	earnedLabel: string
	isAverage: boolean
	loginEventId: string | null
	logoutEventId: string | null
	lessons: TeacherLessonSubjectRow[]
}

type TeacherRateRecord = {
	teacherId: string
	hourlyRate: number
	validFrom: Date
}

type TeacherRecord = {
	id: string
	userId: string
	name: string
}

type GroupRecord = {
	id: string
	teacherId: string
	name: string
	subjectName: string
}

type TeachingSessionRecord = {
	id: string
	teacherId: string
	groupId: string
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

function getDayLessonDurationMs(
	sessions: TeachingSessionRecord[],
	day: string,
): number {
	return sessions
		.filter((session) => sessionMatchesDay(session, day))
		.map((session) => getTeachingSessionDurationMs(session))
		.filter((value): value is number => value != null && value > 0)
		.reduce((sum, value) => sum + value, 0)
}

function getDailyLessonDurationsMs(
	sessions: TeachingSessionRecord[],
	days: string[],
): number[] {
	return days.flatMap((day) => {
		const total = getDayLessonDurationMs(sessions, day)
		return total > 0 ? [total] : []
	})
}

function formatTotalLessonDurationLabel(
	sessions: TeachingSessionRecord[],
	days: string[],
	isAverage: boolean,
): string {
	const dailyTotals = getDailyLessonDurationsMs(sessions, days)

	if (dailyTotals.length === 0) return 'время не учтено'

	if (isAverage) {
		const avg =
			dailyTotals.reduce((sum, value) => sum + value, 0) / dailyTotals.length
		return formatElapsedMs(avg)
	}

	return formatElapsedMs(dailyTotals[0]!)
}

export function calcLessonPayKopecks(
	durationMs: number,
	hourlyRateKopecks: number,
): number {
	if (durationMs <= 0 || hourlyRateKopecks <= 0) return 0
	return Math.round((durationMs * hourlyRateKopecks) / 3_600_000)
}

function pickHourlyRateKopecks(rates: TeacherRateRecord[], day: string): number {
	return (
		rates
			.filter((rate) => getLocalDateString(rate.validFrom) <= day)
			.sort(
				(left, right) =>
					getLocalDateString(right.validFrom).localeCompare(
						getLocalDateString(left.validFrom),
					),
			)[0]?.hourlyRate ?? 0
	)
}

function calcEarnedKopecks(
	sessions: TeachingSessionRecord[],
	days: string[],
	rates: TeacherRateRecord[],
	isAverage: boolean,
): number {
	const dailyAmounts = days.flatMap((day) => {
		const durationMs = getDayLessonDurationMs(sessions, day)
		if (durationMs <= 0) return []
		return [calcLessonPayKopecks(durationMs, pickHourlyRateKopecks(rates, day))]
	})

	if (dailyAmounts.length === 0) return 0
	if (!isAverage) return dailyAmounts[0]!
	return Math.round(
		dailyAmounts.reduce((sum, value) => sum + value, 0) / dailyAmounts.length,
	)
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

function getGroupsForTeacher(
	teacher: TeacherRecord,
	groups: GroupRecord[],
	sessions: TeachingSessionRecord[],
	groupIdFilter: string | null,
): GroupRecord[] {
	const groupMap = new Map<string, GroupRecord>()

	for (const group of groups) {
		if (group.teacherId === teacher.id) {
			groupMap.set(group.id, group)
		}
	}

	for (const session of sessions) {
		if (session.teacherId !== teacher.id || groupMap.has(session.groupId)) {
			continue
		}

		groupMap.set(session.groupId, {
			id: session.groupId,
			teacherId: teacher.id,
			name: '—',
			subjectName: '—',
		})
	}

	let result = [...groupMap.values()].sort((left, right) => {
		const bySubject = left.subjectName.localeCompare(right.subjectName, 'ru')
		if (bySubject !== 0) return bySubject
		return left.name.localeCompare(right.name, 'ru')
	})

	if (groupIdFilter) {
		result = result.filter((group) => group.id === groupIdFilter)
	}

	return result
}

function buildLessonRow(
	teacher: TeacherRecord,
	group: GroupRecord,
	days: string[],
	sessions: TeachingSessionRecord[],
	rates: TeacherRateRecord[],
	isAverage: boolean,
): TeacherLessonSubjectRow {
	const groupSessions = sessions.filter(
		(session) =>
			session.teacherId === teacher.id && session.groupId === group.id,
	)
	const earnedKopecks = calcEarnedKopecks(groupSessions, days, rates, isAverage)

	if (isAverage) {
		const startedTimes = days.flatMap((day) => {
			const daySession = groupSessions.find((session) =>
				sessionMatchesDay(session, day),
			)
			return daySession ? [daySession.startedAt] : []
		})
		const endedTimes = days.flatMap((day) => {
			const daySession = groupSessions.find(
				(session) => sessionMatchesDay(session, day) && session.endedAt,
			)
			return daySession?.endedAt ? [daySession.endedAt] : []
		})
		const completedSessions = groupSessions.filter(
			(session) =>
				session.endedAt != null &&
				days.some((day) => sessionMatchesDay(session, day)),
		)

		return {
			teacherId: teacher.id,
			groupId: group.id,
			groupName: group.name,
			subjectName: group.subjectName,
			lessonStartedAt: formatTimeValue(startedTimes, true),
			lessonEndedAt: formatTimeValue(endedTimes, true),
			lessonDurationLabel: formatLessonDurationLabel(completedSessions, true),
			earnedKopecks,
			earnedLabel: formatMoney(earnedKopecks),
			teachingSessionId: null,
			isAverage: true,
		}
	}

	const day = days[0]!
	const daySession = groupSessions.find((session) =>
		sessionMatchesDay(session, day),
	)

	return {
		teacherId: teacher.id,
		groupId: group.id,
		groupName: group.name,
		subjectName: group.subjectName,
		lessonStartedAt: daySession
			? formatLocalTime(daySession.startedAt)
			: null,
		lessonEndedAt: daySession?.endedAt
			? formatLocalTime(daySession.endedAt)
			: null,
		lessonDurationLabel: daySession
			? formatLessonDurationLabel([daySession], false)
			: 'время не учтено',
		earnedKopecks,
		earnedLabel: formatMoney(earnedKopecks),
		teachingSessionId: daySession?.id ?? null,
		isAverage: false,
	}
}

function buildTeacherRow(
	teacher: TeacherRecord,
	groups: GroupRecord[],
	days: string[],
	sessions: TeachingSessionRecord[],
	logins: AuditTimeRecord[],
	logouts: AuditTimeRecord[],
	rates: TeacherRateRecord[],
	isAverage: boolean,
): TeacherLessonAnalyticsRow {
	const groupIds = new Set(groups.map((group) => group.id))
	const teacherSessions = sessions.filter(
		(session) =>
			session.teacherId === teacher.id && groupIds.has(session.groupId),
	)
	const teacherLogins = logins.filter((login) => login.userId === teacher.userId)
	const teacherLogouts = logouts.filter(
		(logout) => logout.userId === teacher.userId,
	)
	const lessons = groups.map((group) =>
		buildLessonRow(teacher, group, days, teacherSessions, rates, isAverage),
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
		const earnedKopecks = calcEarnedKopecks(
			teacherSessions,
			days,
			rates,
			true,
		)

		return {
			teacherId: teacher.id,
			teacherName: teacher.name,
			loginAt: formatTimeValue(loginTimes, true),
			logoutAt: formatTimeValue(logoutTimes, true),
			totalLessonDurationLabel: formatTotalLessonDurationLabel(
				teacherSessions,
				days,
				true,
			),
			workplaceDurationLabel: formatWorkplaceDurationLabel(
				teacherLogins,
				teacherLogouts,
				days,
				true,
			),
			earnedKopecks,
			earnedLabel: formatMoney(earnedKopecks),
			isAverage: true,
			loginEventId: null,
			logoutEventId: null,
			lessons,
		}
	}

	const day = days[0]!
	const dayLogin = teacherLogins.find((login) => auditTimeMatchesDay(login, day))
	const dayLogout = findLastAuditTimeForDay(teacherLogouts, day)
	const earnedKopecks = calcEarnedKopecks(
		teacherSessions,
		days,
		rates,
		false,
	)

	return {
		teacherId: teacher.id,
		teacherName: teacher.name,
		loginAt: dayLogin ? formatLocalTime(dayLogin.createdAt) : null,
		logoutAt: dayLogout ? formatLocalTime(dayLogout.createdAt) : null,
		totalLessonDurationLabel: formatTotalLessonDurationLabel(
			teacherSessions,
			days,
			false,
		),
		workplaceDurationLabel: formatWorkplaceDurationLabel(
			teacherLogins,
			teacherLogouts,
			days,
			false,
		),
		earnedKopecks,
		earnedLabel: formatMoney(earnedKopecks),
		isAverage: false,
		loginEventId: dayLogin?.id ?? null,
		logoutEventId: dayLogout?.id ?? null,
		lessons,
	}
}

export function buildTeacherLessonAnalyticsRows(
	teachers: TeacherRecord[],
	groups: GroupRecord[],
	sessions: TeachingSessionRecord[],
	logins: AuditTimeRecord[],
	logouts: AuditTimeRecord[],
	from: string,
	to: string,
	groupIdFilter: string | null = null,
	rates: TeacherRateRecord[] = [],
): TeacherLessonAnalyticsRow[] {
	const days = listCalendarDays(from, to)
	const isAverage = isCalendarRange(from, to)

	return teachers.flatMap((teacher) => {
		const teacherGroups = getGroupsForTeacher(
			teacher,
			groups,
			sessions,
			groupIdFilter,
		)

		if (teacherGroups.length === 0) return []

		return [
			buildTeacherRow(
				teacher,
				teacherGroups,
				days,
				sessions,
				logins,
				logouts,
				rates.filter((rate) => rate.teacherId === teacher.id),
				isAverage,
			),
		]
	})
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
