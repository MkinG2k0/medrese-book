import { describe, expect, it } from 'vitest'

import { mapTuitionDebtRows } from './map-tuition-debt-rows'

describe('mapTuitionDebtRows', () => {
	it('emits unpaid month when charge exceeds paid by payment.month', () => {
		const rows = mapTuitionDebtRows([
			{
				studentId: 's1',
				studentName: 'Али',
				parentName: 'Опекун',
				tuitionRateKopecks: 200_000,
				charges: [{ month: '2026-09', amount: 200_000 }],
				payments: [
					{ month: '2026-09', amount: 50_000 },
					{ month: '2026-11', amount: 200_000 },
				],
			},
		])

		expect(rows).toEqual([
			{
				key: 's1:2026-09',
				studentId: 's1',
				studentName: 'Али',
				parentName: 'Опекун',
				month: '2026-09',
				chargeKopecks: 200_000,
				paidKopecks: 50_000,
				debtKopecks: 150_000,
			},
		])
	})

	it('skips months fully covered via payment.month attribution', () => {
		const rows = mapTuitionDebtRows([
			{
				studentId: 's1',
				studentName: 'Али',
				parentName: null,
				tuitionRateKopecks: 200_000,
				charges: [{ month: '2026-09', amount: 200_000 }],
				payments: [{ month: '2026-09', amount: 200_000 }],
			},
		])

		expect(rows).toEqual([])
	})

	it('falls back to tuition rate when charge amount is nullish', () => {
		const rows = mapTuitionDebtRows([
			{
				studentId: 's1',
				studentName: 'Али',
				parentName: null,
				tuitionRateKopecks: 180_000,
				charges: [
					{
						month: '2026-10',
						amount: null as unknown as number,
					},
				],
				payments: [],
			},
		])

		expect(rows[0]?.chargeKopecks).toBe(180_000)
		expect(rows[0]?.debtKopecks).toBe(180_000)
	})

	it('does not count payments attributed to another month', () => {
		const rows = mapTuitionDebtRows([
			{
				studentId: 's1',
				studentName: 'Али',
				parentName: null,
				tuitionRateKopecks: 200_000,
				charges: [{ month: '2026-09', amount: 200_000 }],
				payments: [{ month: '2026-11', amount: 200_000 }],
			},
		])

		expect(rows).toHaveLength(1)
		expect(rows[0]?.month).toBe('2026-09')
		expect(rows[0]?.paidKopecks).toBe(0)
		expect(rows[0]?.debtKopecks).toBe(200_000)
	})
})
