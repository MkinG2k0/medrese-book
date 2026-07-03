import { describe, expect, it } from 'vitest'

import { MonthClosedError, assertMonthOpenForKey } from './month-close-rules'
import {
	computeStudentBalanceKopecks,
	resolveStudentPaymentStatus,
} from './compute-student-balance'
import { reversalAmount, validateReversalTarget } from './create-reversal'
import { LESSON_ANOMALY_MINUTES, isSessionAnomaly } from './teacher-hours'

describe('computeStudentBalanceKopecks', () => {
	it('returns advance when payments exceed charges', () => {
		expect(computeStudentBalanceKopecks(500_000, 400_000)).toBe(100_000)
	})

	it('returns debt when charges exceed payments', () => {
		expect(computeStudentBalanceKopecks(100_000, 400_000)).toBe(-300_000)
	})
})

describe('resolveStudentPaymentStatus', () => {
	it('marks paid when month fully covered', () => {
		expect(
			resolveStudentPaymentStatus(0, 200_000, 200_000),
		).toEqual({ kind: 'paid' })
	})

	it('marks advance when balance positive', () => {
		expect(
			resolveStudentPaymentStatus(50_000, 200_000, 200_000),
		).toEqual({ kind: 'advance', advanceKopecks: 50_000 })
	})
})

describe('assertMonthOpenForKey', () => {
	it('throws for closed month', () => {
		expect(() =>
			assertMonthOpenForKey('2026-07', new Set(['2026-07'])),
		).toThrow(MonthClosedError)
	})
})

describe('validateReversalTarget', () => {
	it('rejects already reversed records', () => {
		expect(() =>
			validateReversalTarget(
				{
					id: '1',
					amount: 1000,
					reversalOfId: null,
					reversals: [{ id: '2' }],
				},
				'Платёж',
			),
		).toThrow('уже сторнирована')
	})

	it('creates negative reversal amount', () => {
		expect(reversalAmount(150_000)).toBe(-150_000)
	})
})

describe('isSessionAnomaly', () => {
	it('flags lessons longer than 3 hours', () => {
		const startedAt = new Date('2026-07-01T10:00:00')
		const endedAt = new Date('2026-07-01T14:00:00')
		expect(
			isSessionAnomaly({
				id: 's1',
				teacherId: 't1',
				startedAt,
				endedAt,
				date: startedAt,
			}),
		).toBe(true)
	})

	it('ignores adjusted sessions', () => {
		const startedAt = new Date('2026-07-01T10:00:00')
		const endedAt = new Date('2026-07-01T14:00:00')
		expect(
			isSessionAnomaly({
				id: 's1',
				teacherId: 't1',
				startedAt,
				endedAt,
				date: startedAt,
				durationAdjustment: {
					originalMinutes: 240,
					adjustedMinutes: 90,
				},
			}),
		).toBe(false)
	})

	it(`uses ${LESSON_ANOMALY_MINUTES} minutes threshold`, () => {
		const startedAt = new Date('2026-07-01T10:00:00')
		const endedAt = new Date('2026-07-01T13:00:00')
		expect(
			isSessionAnomaly({
				id: 's1',
				teacherId: 't1',
				startedAt,
				endedAt,
				date: startedAt,
			}),
		).toBe(false)
	})
})
