import type { PaymentMethod } from '@/shared/lib/prisma'

const STORAGE_KEY = 'accounting.lastPaymentMethod'
const ALLOWED: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER']

export function loadLastPaymentMethod(
	fallback: PaymentMethod = 'CASH',
): PaymentMethod {
	if (typeof window === 'undefined') return fallback
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (raw && (ALLOWED as string[]).includes(raw)) {
			return raw as PaymentMethod
		}
	} catch {
		/* ignore */
	}
	return fallback
}

export function saveLastPaymentMethod(method: PaymentMethod): void {
	if (typeof window === 'undefined') return
	try {
		window.localStorage.setItem(STORAGE_KEY, method)
	} catch {
		/* ignore */
	}
}
