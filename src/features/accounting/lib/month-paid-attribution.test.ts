import { describe, expect, it } from 'vitest'

import {
	paymentMonthFromRequest,
	sumPaidForAttributionMonth,
} from './month-paid-attribution'

describe('sumPaidForAttributionMonth', () => {
	it('counts payment toward attribution month even when calendar date differs', () => {
		const payments = [
			{
				month: '2026-09',
				amount: 150_000,
				date: new Date('2026-11-05T12:00:00.000Z'),
			},
			{
				month: '2026-11',
				amount: 50_000,
				date: new Date('2026-11-05T12:00:00.000Z'),
			},
		]

		expect(sumPaidForAttributionMonth(payments, '2026-09')).toBe(150_000)
		expect(sumPaidForAttributionMonth(payments, '2026-11')).toBe(50_000)
		expect(sumPaidForAttributionMonth(payments, '2026-10')).toBe(0)
	})
})

describe('paymentMonthFromRequest', () => {
	it('copies month from DB-loaded request for confirm attribution', () => {
		expect(paymentMonthFromRequest('2026-09')).toBe('2026-09')
	})
})
