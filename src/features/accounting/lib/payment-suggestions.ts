import type { StudentPaymentRow } from '@/entities/accounting/model/types'

/** Остаток до тарифа/начисления за выбранный месяц. */
export function remainingToMonthChargeKopecks(row: StudentPaymentRow): number {
	return Math.max(0, row.monthChargeKopecks - row.monthPaidKopecks)
}

/** Сумма долга по накопительному сальдо (0 если долга нет). */
export function debtKopecks(row: StudentPaymentRow): number {
	return row.balanceKopecks < 0 ? Math.abs(row.balanceKopecks) : 0
}

/**
 * Префилл для модалки/инлайна:
 * 1) остаток до месячного начисления,
 * 2) иначе общий долг,
 * 3) иначе тариф (для аванса «ещё раз»).
 */
export function suggestPaymentAmountKopecks(row: StudentPaymentRow): number {
	const remaining = remainingToMonthChargeKopecks(row)
	if (remaining > 0) return remaining
	const debt = debtKopecks(row)
	if (debt > 0) return debt
	return row.tuitionRateKopecks > 0 ? row.tuitionRateKopecks : 0
}
