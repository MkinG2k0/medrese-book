import {
	countableCompletionWhere,
	countableSessionWhere,
} from '@/shared/lib/analytics-queries/filters'

import { AT_RISK_CONFIG } from './at-risk-config'
import type { StudentPeriodMetrics } from './types'

type SessionInput = {
	date: Date
	isAdjustment: boolean
}

type CompletionInput = {
	createdAt: Date
	isPriorCredit: boolean
}

type TeachingSessionDayInput = {
	date: Date
	durationMinutes: number | null
}

export type ComputePeriodMetricsInput = {
	sessions: SessionInput[]
	completions: CompletionInput[]
	teachingSessionsByDate?: TeachingSessionDayInput[]
	completedStepHoursOnLevel: number[]
	dateRange: { gte: Date; lte: Date }
	monthLabel: string
	actualTimeSource?: typeof AT_RISK_CONFIG.actualTimeSource
}

function isInDateRange(date: Date, range: { gte: Date; lte: Date }): boolean {
	return date >= range.gte && date <= range.lte
}

function isCountableSession(session: SessionInput): boolean {
	return session.isAdjustment === countableSessionWhere.isAdjustment
}

function isCountableCompletion(completion: CompletionInput): boolean {
	return completion.isPriorCredit === countableCompletionWhere.isPriorCredit
}

function calendarDayKey(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function computeProxyTotalMinutes(
	lessonsCount: number,
	completedStepHoursOnLevel: number[],
): number {
	if (lessonsCount === 0 || completedStepHoursOnLevel.length === 0) {
		return 0
	}

	const avgHours =
		completedStepHoursOnLevel.reduce((sum, hours) => sum + hours, 0) /
		completedStepHoursOnLevel.length

	return Math.round(lessonsCount * avgHours * 60)
}

function computeTeachingSessionTotalMinutes(
	countableSessionsInRange: SessionInput[],
	teachingSessionsByDate: TeachingSessionDayInput[],
): number {
	const sessionDays = new Set(
		countableSessionsInRange.map((session) => calendarDayKey(session.date)),
	)

	const durationByDay = new Map<string, number>()
	for (const teachingSession of teachingSessionsByDate) {
		const dayKey = calendarDayKey(teachingSession.date)
		if (!sessionDays.has(dayKey)) continue
		if (teachingSession.durationMinutes == null) continue

		durationByDay.set(
			dayKey,
			(durationByDay.get(dayKey) ?? 0) + teachingSession.durationMinutes,
		)
	}

	return Array.from(durationByDay.values()).reduce(
		(sum, minutes) => sum + minutes,
		0,
	)
}

export function computePeriodMetrics(
	input: ComputePeriodMetricsInput,
): StudentPeriodMetrics {
	const countableSessionsInRange = input.sessions.filter(
		(session) =>
			isCountableSession(session) &&
			isInDateRange(session.date, input.dateRange),
	)
	const countableCompletionsInRange = input.completions.filter(
		(completion) =>
			isCountableCompletion(completion) &&
			isInDateRange(completion.createdAt, input.dateRange),
	)

	const lessonsCount = countableSessionsInRange.length
	const stepsCount = countableCompletionsInRange.length
	const actualTimeSource =
		input.actualTimeSource ?? AT_RISK_CONFIG.actualTimeSource

	const totalMinutes =
		actualTimeSource === 'teaching_session'
			? computeTeachingSessionTotalMinutes(
					countableSessionsInRange,
					input.teachingSessionsByDate ?? [],
				)
			: computeProxyTotalMinutes(
					lessonsCount,
					input.completedStepHoursOnLevel,
				)

	return {
		lessonsCount,
		stepsCount,
		totalMinutes,
		monthLabel: input.monthLabel,
	}
}

export type ComputeLevelProgressInput = {
	currentStepIdx: number
	levelNumber: number
	levelStepOffset: number
	totalStepsOnLevel: number
	completedStepsOnLevel: number
}

export type LevelProgress = {
	currentLevelNumber: number
	completedStepsOnLevel: number
	totalStepsOnLevel: number
	localStepIdx: number
}

export function computeLevelProgress(
	input: ComputeLevelProgressInput,
): LevelProgress {
	return {
		currentLevelNumber: input.levelNumber,
		completedStepsOnLevel: input.completedStepsOnLevel,
		totalStepsOnLevel: input.totalStepsOnLevel,
		localStepIdx: input.currentStepIdx - input.levelStepOffset,
	}
}
