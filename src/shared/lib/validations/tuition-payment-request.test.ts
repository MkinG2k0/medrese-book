import { describe, expect, it } from 'vitest'

import { createTuitionPaymentRequestSchema } from '@/shared/lib/validations/accounting'

describe('createTuitionPaymentRequestSchema', () => {
	it('принимает одну или несколько строк с разными суммами и month', () => {
		const parsed = createTuitionPaymentRequestSchema.safeParse({
			month: '2026-09',
			lines: [
				{ studentId: 's1', amountKopecks: 200000 },
				{ studentId: 's2', amountKopecks: 150000 },
			],
		})
		expect(parsed.success).toBe(true)
	})

	it('отклоняет заявку без month', () => {
		expect(
			createTuitionPaymentRequestSchema.safeParse({
				lines: [{ studentId: 's1', amountKopecks: 200000 }],
			}).success,
		).toBe(false)
	})

	it('отклоняет некорректный month', () => {
		expect(
			createTuitionPaymentRequestSchema.safeParse({
				month: '2026-9',
				lines: [{ studentId: 's1', amountKopecks: 200000 }],
			}).success,
		).toBe(false)
	})

	it('отклоняет пустой список и нулевую сумму', () => {
		expect(
			createTuitionPaymentRequestSchema.safeParse({
				month: '2026-09',
				lines: [],
			}).success,
		).toBe(false)
		expect(
			createTuitionPaymentRequestSchema.safeParse({
				month: '2026-09',
				lines: [{ studentId: 's1', amountKopecks: 0 }],
			}).success,
		).toBe(false)
	})
})
