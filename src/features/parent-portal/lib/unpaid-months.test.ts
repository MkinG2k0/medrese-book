import { describe, expect, it } from 'vitest'

import { iterateMonths } from '@/shared/lib/accounting/month'

import {
	buildParentMonthFlags,
	buildParentMonthRange,
	isMonthUnpaid,
	isMonthUnpaidAcrossChildren,
	pickDefaultParentMonth,
	resolveMonthChargeKopecks,
} from './unpaid-months'

describe('isMonthUnpaid', () => {
	it('marks partial coverage as unpaid (D-06)', () => {
		expect(
			isMonthUnpaid({ chargeKopecks: 100_000, paidKopecks: 40_000 }),
		).toBe(true)
	})

	it('is false when paid covers charge', () => {
		expect(
			isMonthUnpaid({ chargeKopecks: 100_000, paidKopecks: 100_000 }),
		).toBe(false)
		expect(
			isMonthUnpaid({ chargeKopecks: 100_000, paidKopecks: 120_000 }),
		).toBe(false)
	})

	it('is false when charge is zero', () => {
		expect(isMonthUnpaid({ chargeKopecks: 0, paidKopecks: 0 })).toBe(false)
	})
})

describe('resolveMonthChargeKopecks', () => {
	it('uses charge when present and tariff as fallback', () => {
		expect(resolveMonthChargeKopecks(80_000, 100_000)).toBe(80_000)
		expect(resolveMonthChargeKopecks(null, 100_000)).toBe(100_000)
		expect(resolveMonthChargeKopecks(undefined, 100_000)).toBe(100_000)
		expect(resolveMonthChargeKopecks(0, 100_000)).toBe(0)
	})
})

describe('iterateMonths', () => {
	it('returns inclusive YYYY-MM sequence (D-05)', () => {
		expect(iterateMonths('2026-09', '2026-11')).toEqual([
			'2026-09',
			'2026-10',
			'2026-11',
		])
		expect(iterateMonths('2025-11', '2026-01')).toEqual([
			'2025-11',
			'2025-12',
			'2026-01',
		])
		expect(iterateMonths('2026-03', '2026-03')).toEqual(['2026-03'])
	})
})

describe('buildParentMonthRange', () => {
	it('spans earliest child month through current inclusive (D-05)', () => {
		expect(
			buildParentMonthRange({
				earliestMonths: ['2026-10', '2026-08'],
				currentMonth: '2026-11',
			}),
		).toEqual(['2026-08', '2026-09', '2026-10', '2026-11'])
	})

	it('falls back to current when no earliest months', () => {
		expect(
			buildParentMonthRange({
				earliestMonths: [],
				currentMonth: '2026-11',
			}),
		).toEqual(['2026-11'])
	})
})

describe('isMonthUnpaidAcrossChildren / buildParentMonthFlags', () => {
	it('uses OR across selected children (A1 / D-06)', () => {
		expect(
			isMonthUnpaidAcrossChildren([
				{ studentId: 'a', chargeKopecks: 100_000, paidKopecks: 100_000 },
				{ studentId: 'b', chargeKopecks: 100_000, paidKopecks: 50_000 },
			]),
		).toBe(true)

		expect(
			isMonthUnpaidAcrossChildren([
				{ studentId: 'a', chargeKopecks: 100_000, paidKopecks: 100_000 },
				{ studentId: 'b', chargeKopecks: 100_000, paidKopecks: 100_000 },
			]),
		).toBe(false)
	})

	it('marks yellow only from selected children', () => {
		const flags = buildParentMonthFlags({
			months: ['2026-09', '2026-10'],
			selectedStudentIds: ['child-a'],
			children: [
				{
					studentId: 'child-a',
					tuitionRateKopecks: 100_000,
					chargesByMonth: { '2026-09': 100_000, '2026-10': 100_000 },
					paidByMonth: { '2026-09': 100_000, '2026-10': 0 },
				},
				{
					studentId: 'child-b',
					tuitionRateKopecks: 100_000,
					chargesByMonth: { '2026-09': 100_000, '2026-10': 100_000 },
					paidByMonth: { '2026-09': 0, '2026-10': 0 },
				},
			],
		})

		expect(flags).toEqual([
			expect.objectContaining({ value: '2026-09', unpaid: false }),
			expect.objectContaining({ value: '2026-10', unpaid: true }),
		])
	})
})

describe('pickDefaultParentMonth', () => {
	it('picks first unpaid else current month', () => {
		expect(
			pickDefaultParentMonth(
				[
					{ value: '2026-09', unpaid: false },
					{ value: '2026-10', unpaid: true },
					{ value: '2026-11', unpaid: true },
				],
				'2026-11',
			),
		).toBe('2026-10')

		expect(
			pickDefaultParentMonth(
				[
					{ value: '2026-09', unpaid: false },
					{ value: '2026-10', unpaid: false },
				],
				'2026-11',
			),
		).toBe('2026-11')
	})
})
