import { describe, expect, it } from 'vitest'

import { AT_RISK_CONFIG } from './at-risk-config'
import { computeLevelProgress, computePeriodMetrics } from './period-metrics'

describe('computePeriodMetrics', () => {
	const dateRange = {
		gte: new Date('2026-01-01T00:00:00.000Z'),
		lte: new Date('2026-01-31T23:59:59.999Z'),
	}

	it('excludes adjustment sessions from lessonsCount', () => {
		const result = computePeriodMetrics({
			sessions: [
				{
					date: new Date('2026-01-05T10:00:00.000Z'),
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-06T10:00:00.000Z'),
					isAdjustment: false,
				},
				{
					date: new Date('2026-01-07T10:00:00.000Z'),
					isAdjustment: true,
				},
			],
			completions: [],
			completedStepHoursOnLevel: [],
			dateRange,
			monthLabel: 'январь 2026',
		})

		expect(result.lessonsCount).toBe(2)
	})

	it('excludes prior credit completions from stepsCount', () => {
		const result = computePeriodMetrics({
			sessions: [],
			completions: [
				{
					createdAt: new Date('2026-01-05T10:00:00.000Z'),
					isPriorCredit: false,
				},
				{
					createdAt: new Date('2026-01-06T10:00:00.000Z'),
					isPriorCredit: false,
				},
				{
					createdAt: new Date('2026-01-07T10:00:00.000Z'),
					isPriorCredit: true,
				},
			],
			completedStepHoursOnLevel: [],
			dateRange,
			monthLabel: 'январь 2026',
		})

		expect(result.stepsCount).toBe(2)
	})

	it('uses proxy totalMinutes as sessionsCount × avg step hours × 60', () => {
		const result = computePeriodMetrics({
			sessions: [
				{ date: new Date('2026-01-01T10:00:00.000Z'), isAdjustment: false },
				{ date: new Date('2026-01-02T10:00:00.000Z'), isAdjustment: false },
				{ date: new Date('2026-01-03T10:00:00.000Z'), isAdjustment: false },
				{ date: new Date('2026-01-04T10:00:00.000Z'), isAdjustment: false },
			],
			completions: [],
			completedStepHoursOnLevel: [2, 2],
			dateRange,
			monthLabel: 'январь 2026',
			actualTimeSource: AT_RISK_CONFIG.actualTimeSource,
		})

		expect(result.totalMinutes).toBe(480)
	})

	it('uses teaching_session duration only on days with countable sessions', () => {
		const result = computePeriodMetrics({
			sessions: [
				{ date: new Date('2026-01-01T10:00:00.000Z'), isAdjustment: false },
				{ date: new Date('2026-01-02T10:00:00.000Z'), isAdjustment: false },
			],
			completions: [],
			completedStepHoursOnLevel: [2],
			teachingSessionsByDate: [
				{
					date: new Date('2026-01-01T10:00:00.000Z'),
					durationMinutes: 45,
				},
				{
					date: new Date('2026-01-02T10:00:00.000Z'),
					durationMinutes: 30,
				},
				{
					date: new Date('2026-01-03T10:00:00.000Z'),
					durationMinutes: 90,
				},
			],
			dateRange,
			monthLabel: 'январь 2026',
			actualTimeSource: 'teaching_session',
		})

		expect(result.totalMinutes).toBe(75)
	})
})

describe('computeLevelProgress', () => {
	it('returns level progress with local step index', () => {
		const result = computeLevelProgress({
			currentStepIdx: 12,
			levelNumber: 2,
			levelStepOffset: 10,
			totalStepsOnLevel: 8,
			completedStepsOnLevel: 3,
		})

		expect(result).toEqual({
			currentLevelNumber: 2,
			completedStepsOnLevel: 3,
			totalStepsOnLevel: 8,
			localStepIdx: 2,
		})
	})
})
