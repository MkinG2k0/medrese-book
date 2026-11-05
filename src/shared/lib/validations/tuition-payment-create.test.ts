import { describe, expect, it } from 'vitest'

import {
	createTuitionPaymentSchema,
	createTuitionPaymentsBatchSchema,
} from '@/shared/lib/validations/accounting'

describe('createTuitionPaymentSchema', () => {
	const base = {
		studentId: 's1',
		date: '2026-11-05',
		amountKopecks: 200000,
		method: 'CASH' as const,
	}

	it('принимает платёж с валидным month', () => {
		const parsed = createTuitionPaymentSchema.safeParse({
			...base,
			month: '2026-09',
		})
		expect(parsed.success).toBe(true)
	})

	it('отклоняет платёж без month', () => {
		expect(createTuitionPaymentSchema.safeParse(base).success).toBe(false)
	})

	it('отклоняет некорректный month', () => {
		expect(
			createTuitionPaymentSchema.safeParse({
				...base,
				month: 'september',
			}).success,
		).toBe(false)
	})
})

describe('createTuitionPaymentsBatchSchema', () => {
	const base = {
		date: '2026-11-05',
		method: 'CASH' as const,
		items: [{ studentId: 's1', amountKopecks: 100000 }],
	}

	it('принимает batch с валидным month', () => {
		const parsed = createTuitionPaymentsBatchSchema.safeParse({
			...base,
			month: '2026-09',
		})
		expect(parsed.success).toBe(true)
	})

	it('отклоняет batch без month', () => {
		expect(createTuitionPaymentsBatchSchema.safeParse(base).success).toBe(
			false,
		)
	})
})
