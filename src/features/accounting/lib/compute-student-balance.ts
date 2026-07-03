export function computeStudentBalanceKopecks(
	totalPayments: number,
	totalCharges: number,
): number {
	return totalPayments - totalCharges
}

export type StudentPaymentStatus =
	| { kind: 'paid' }
	| { kind: 'partial'; debtKopecks: number }
	| { kind: 'debt'; debtMonths: number; debtKopecks: number }
	| { kind: 'advance'; advanceKopecks: number }

export function resolveStudentPaymentStatus(
	balanceKopecks: number,
	monthChargeKopecks: number,
	monthPaidKopecks: number,
): StudentPaymentStatus {
	if (monthChargeKopecks > 0 && monthPaidKopecks >= monthChargeKopecks) {
		if (balanceKopecks > 0) {
			return { kind: 'advance', advanceKopecks: balanceKopecks }
		}
		return { kind: 'paid' }
	}

	if (monthChargeKopecks > 0 && monthPaidKopecks > 0) {
		return {
			kind: 'partial',
			debtKopecks: monthChargeKopecks - monthPaidKopecks,
		}
	}

	if (balanceKopecks < 0) {
		const debtKopecks = Math.abs(balanceKopecks)
		const debtMonths =
			monthChargeKopecks > 0
				? Math.max(1, Math.ceil(debtKopecks / monthChargeKopecks))
				: 1
		return { kind: 'debt', debtMonths, debtKopecks }
	}

	if (balanceKopecks > 0) {
		return { kind: 'advance', advanceKopecks: balanceKopecks }
	}

	return { kind: 'paid' }
}
