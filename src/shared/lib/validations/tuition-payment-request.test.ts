import { describe, expect, it } from 'vitest'

import { createTuitionPaymentRequestSchema } from '@/shared/lib/validations/accounting'

describe('createTuitionPaymentRequestSchema', () => {
	it('принимает одну или несколько строк с разными суммами', () => {
		const parsed = createTuitionPaymentRequestSchema.safeParse({
			lines: [
				{ studentId: 's1', amountKopecks: 200000 },
				{ studentId: 's2', amountKopecks: 150000 },
			],
		})
		expect(parsed.success).toBe(true)
	})

	it('отклоняет пустой список и нулевую сумму', () => {
		expect(
			createTuitionPaymentRequestSchema.safeParse({ lines: [] }).success,
		).toBe(false)
		expect(
			createTuitionPaymentRequestSchema.safeParse({
				lines: [{ studentId: 's1', amountKopecks: 0 }],
			}).success,
		).toBe(false)
	})
})
