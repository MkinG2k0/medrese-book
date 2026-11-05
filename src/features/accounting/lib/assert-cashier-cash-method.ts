import type { PaymentMethod, Role } from '@/shared/lib/prisma'

const CASHIER_CASH_ONLY_MESSAGE = 'Кассир может проводить только наличные'

export function assertCashierCashMethod(
	role: Role | string,
	method: PaymentMethod | string,
): string | null {
	if (role === 'CASHIER' && method !== 'CASH') {
		return CASHIER_CASH_ONLY_MESSAGE
	}
	return null
}

export function canReverseForActor(
	role: Role | string,
	businessCanReverse: boolean,
): boolean {
	if (role === 'CASHIER') return false
	return businessCanReverse
}
