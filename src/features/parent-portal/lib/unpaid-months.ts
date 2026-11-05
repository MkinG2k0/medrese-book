import { iterateMonths, parseMonthKey } from '@/shared/lib/accounting/month'

export function isMonthUnpaid(input: {
	chargeKopecks: number
	paidKopecks: number
}): boolean {
	return input.chargeKopecks > 0 && input.paidKopecks < input.chargeKopecks
}

/** Charge amount, or tariff as charge when no charge row (payments query parity). */
export function resolveMonthChargeKopecks(
	chargeAmount: number | null | undefined,
	tuitionRateKopecks: number,
): number {
	return chargeAmount ?? tuitionRateKopecks
}

export interface ChildMonthCoverage {
	studentId: string
	chargeKopecks: number
	paidKopecks: number
}

/** D-06/A1: month yellow if ANY selected child is unpaid (OR). */
export function isMonthUnpaidAcrossChildren(
	children: ChildMonthCoverage[],
): boolean {
	return children.some((child) =>
		isMonthUnpaid({
			chargeKopecks: child.chargeKopecks,
			paidKopecks: child.paidKopecks,
		}),
	)
}

export interface ChildMonthLedger {
	studentId: string
	tuitionRateKopecks: number
	chargesByMonth: Record<string, number>
	paidByMonth: Record<string, number>
}

export interface ParentMonthOption {
	value: string
	label: string
	unpaid: boolean
}

export function buildParentMonthRange(input: {
	earliestMonths: string[]
	currentMonth: string
}): string[] {
	const valid = input.earliestMonths.filter((month) =>
		/^\d{4}-\d{2}$/.test(month),
	)
	if (valid.length === 0) return [input.currentMonth]

	const from = valid.reduce((min, month) => (month < min ? month : min))
	if (from > input.currentMonth) return [input.currentMonth]
	return iterateMonths(from, input.currentMonth)
}

function formatMonthLabel(month: string): string {
	const { year, month: m } = parseMonthKey(month)
	return new Date(year, m - 1, 1).toLocaleDateString('ru-RU', {
		month: 'long',
		year: 'numeric',
	})
}

export function buildParentMonthFlags(input: {
	months: string[]
	selectedStudentIds: string[]
	children: ChildMonthLedger[]
}): ParentMonthOption[] {
	const selected = input.children.filter((child) =>
		input.selectedStudentIds.includes(child.studentId),
	)

	return input.months.map((month) => {
		const coverages = selected.map((child) => ({
			studentId: child.studentId,
			chargeKopecks: resolveMonthChargeKopecks(
				child.chargesByMonth[month],
				child.tuitionRateKopecks,
			),
			paidKopecks: child.paidByMonth[month] ?? 0,
		}))

		return {
			value: month,
			label: formatMonthLabel(month),
			unpaid: isMonthUnpaidAcrossChildren(coverages),
		}
	})
}

export function pickDefaultParentMonth(
	options: Array<{ value: string; unpaid: boolean }>,
	currentMonth: string,
): string {
	return options.find((option) => option.unpaid)?.value ?? currentMonth
}

/** Earliest of charge months / enrollment months, else fallback (D-05). */
export function resolveEarliestChildMonth(input: {
	chargeMonths: string[]
	enrollmentMonthKeys: string[]
	fallbackMonth: string
}): string {
	const candidates = [
		...input.chargeMonths,
		...input.enrollmentMonthKeys,
	].filter((month) => /^\d{4}-\d{2}$/.test(month))
	if (candidates.length === 0) return input.fallbackMonth
	return candidates.reduce((min, month) => (month < min ? month : min))
}

export function aggregatePaidByMonth(
	payments: Array<{ month: string; amount: number }>,
): Record<string, number> {
	const paidByMonth: Record<string, number> = {}
	for (const payment of payments) {
		paidByMonth[payment.month] =
			(paidByMonth[payment.month] ?? 0) + payment.amount
	}
	return paidByMonth
}

export function chargesRecordFromRows(
	charges: Array<{ month: string; amount: number }>,
): Record<string, number> {
	return Object.fromEntries(
		charges.map((charge) => [charge.month, charge.amount]),
	)
}
