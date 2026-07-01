import { countableSessionWhere } from '@/shared/lib/analytics-queries/filters'

import { AT_RISK_CONFIG, type AtRiskConfig } from './at-risk-config'

type SessionInput = {
	date: Date
	attendance: string
	isAdjustment: boolean
}

export type EvaluateAttendanceRiskInput = {
	sessions: SessionInput[]
	monthRange: { gte: Date; lte: Date }
	config?: Pick<
		AtRiskConfig,
		'attendanceMonthThreshold' | 'attendanceConsecutiveThreshold'
	>
}

function isInDateRange(date: Date, range: { gte: Date; lte: Date }): boolean {
	return date >= range.gte && date <= range.lte
}

function isCountableAbsentSession(session: SessionInput): boolean {
	return (
		session.isAdjustment === countableSessionWhere.isAdjustment &&
		session.attendance === 'ABSENT'
	)
}

function countAbsencesInMonth(
	sessions: SessionInput[],
	monthRange: { gte: Date; lte: Date },
): number {
	return sessions.filter(
		(session) =>
			isCountableAbsentSession(session) &&
			isInDateRange(session.date, monthRange),
	).length
}

function maxConsecutiveAbsences(sessions: SessionInput[]): number {
	const sortedCountableSessions = sessions
		.filter(
			(session) =>
				session.isAdjustment === countableSessionWhere.isAdjustment,
		)
		.sort((a, b) => a.date.getTime() - b.date.getTime())

	let maxStreak = 0
	let currentStreak = 0

	for (const session of sortedCountableSessions) {
		if (session.attendance === 'ABSENT') {
			currentStreak += 1
			maxStreak = Math.max(maxStreak, currentStreak)
			continue
		}

		currentStreak = 0
	}

	return maxStreak
}

export function evaluateAttendanceRisk(
	input: EvaluateAttendanceRiskInput,
): boolean {
	const config = input.config ?? AT_RISK_CONFIG
	const absencesInMonth = countAbsencesInMonth(
		input.sessions,
		input.monthRange,
	)
	const consecutiveAbsences = maxConsecutiveAbsences(input.sessions)

	return (
		absencesInMonth >= config.attendanceMonthThreshold ||
		consecutiveAbsences >= config.attendanceConsecutiveThreshold
	)
}

export function countStudentAbsencesInMonth(
	sessions: SessionInput[],
	monthRange: { gte: Date; lte: Date },
): number {
	return countAbsencesInMonth(sessions, monthRange)
}
