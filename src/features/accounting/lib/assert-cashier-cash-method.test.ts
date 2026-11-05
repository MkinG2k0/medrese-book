import { describe, expect, it } from 'vitest'

import {
	assertCashierCashMethod,
	canReverseForActor,
} from './assert-cashier-cash-method'

describe('assertCashierCashMethod', () => {
	it('allows cashier with CASH', () => {
		expect(assertCashierCashMethod('CASHIER', 'CASH')).toBeNull()
	})

	it('rejects cashier with CARD using Russian cash-only message', () => {
		const message = assertCashierCashMethod('CASHIER', 'CARD')
		expect(message).toMatch(/наличн/i)
		expect(message).not.toBeNull()
	})

	it('rejects cashier with TRANSFER', () => {
		expect(assertCashierCashMethod('CASHIER', 'TRANSFER')).not.toBeNull()
	})

	it('allows accountant with CARD', () => {
		expect(assertCashierCashMethod('ACCOUNTANT', 'CARD')).toBeNull()
	})
})

describe('canReverseForActor', () => {
	it('forces false for cashier even when business allows reverse', () => {
		expect(canReverseForActor('CASHIER', true)).toBe(false)
	})

	it('keeps true for accountant when business allows reverse', () => {
		expect(canReverseForActor('ACCOUNTANT', true)).toBe(true)
	})

	it('keeps false for accountant when business forbids reverse', () => {
		expect(canReverseForActor('ACCOUNTANT', false)).toBe(false)
	})
})
