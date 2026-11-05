import { sumPaidForAttributionMonth } from './month-paid-attribution'

export type TuitionDebtSourceStudent = {
	studentId: string
	studentName: string
	parentName: string | null
	tuitionRateKopecks: number
	charges: Array<{ month: string; amount: number }>
	payments: Array<{ month: string; amount: number }>
}

export type TuitionDebtRow = {
	key: string
	studentId: string
	studentName: string
	parentName: string | null
	month: string
	chargeKopecks: number
	paidKopecks: number
	debtKopecks: number
}

/** Pure mapper: unpaid months only; paid by payment.month (D-02/D-06/D-08). */
export function mapTuitionDebtRows(
	students: TuitionDebtSourceStudent[],
): TuitionDebtRow[] {
	const rows: TuitionDebtRow[] = []

	for (const student of students) {
		const months = [
			...new Set(student.charges.map((charge) => charge.month)),
		].sort()

		for (const month of months) {
			const chargeKopecks =
				student.charges.find((charge) => charge.month === month)?.amount ??
				student.tuitionRateKopecks
			const paidKopecks = sumPaidForAttributionMonth(
				student.payments,
				month,
			)
			const debtKopecks = chargeKopecks - paidKopecks
			if (debtKopecks <= 0) continue

			rows.push({
				key: `${student.studentId}:${month}`,
				studentId: student.studentId,
				studentName: student.studentName,
				parentName: student.parentName,
				month,
				chargeKopecks,
				paidKopecks,
				debtKopecks,
			})
		}
	}

	return rows.sort((a, b) => {
		const byMonth = a.month.localeCompare(b.month)
		if (byMonth !== 0) return byMonth
		return a.studentName.localeCompare(b.studentName, 'ru')
	})
}
