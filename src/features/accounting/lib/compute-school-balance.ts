import { monthKeyToDateRange, toMonthKey } from '@/shared/lib/accounting/month'
import { prisma } from '@/shared/lib/prisma'

export type SchoolBalanceSummary = {
	balanceKopecks: number
	cashBalanceKopecks: number
	cardBalanceKopecks: number
	transferBalanceKopecks: number
	obligationsKopecks: number
	monthIncomeKopecks: number
	monthChargedKopecks: number
	totalDebtKopecks: number
	debtorCount: number
}

function sumByMethod(
	rows: { amount: number; method: string }[],
	method: string,
): number {
	return rows
		.filter((row) => row.method === method)
		.reduce((sum, row) => sum + row.amount, 0)
}

export async function querySchoolBalanceSummary(
	month: string,
): Promise<SchoolBalanceSummary> {
	const { start, end } = monthKeyToDateRange(month)

	const [
		payments,
		donations,
		expenses,
		salaryPayouts,
		confirmedAccruals,
		monthChargesAgg,
		monthPayments,
		students,
	] = await Promise.all([
		prisma.tuitionPayment.findMany({ select: { amount: true, method: true } }),
		prisma.donation.findMany({ select: { amount: true, method: true } }),
		prisma.expense.findMany({ select: { amount: true, method: true } }),
		prisma.salaryPayout.findMany({ select: { amount: true, method: true } }),
		prisma.salaryAccrual.findMany({
			where: { status: 'CONFIRMED' },
			select: { amount: true, payouts: { select: { amount: true } } },
		}),
		prisma.tuitionCharge.aggregate({
			where: { month },
			_sum: { amount: true },
		}),
		prisma.tuitionPayment.findMany({
			where: { date: { gte: start, lte: end } },
			select: { amount: true },
		}),
		prisma.student.findMany({
			where: { status: 'ACTIVE' },
			select: {
				id: true,
				tuitionRate: true,
				tuitionCharges: { select: { amount: true } },
				tuitionPayments: { select: { amount: true } },
			},
		}),
	])

	const incomeRows = [...payments, ...donations]
	const outflowRows = [...expenses, ...salaryPayouts]

	const income = incomeRows.reduce((s, r) => s + r.amount, 0)
	const outflow = outflowRows.reduce((s, r) => s + r.amount, 0)
	const balanceKopecks = income - outflow

	const cashIn =
		sumByMethod(incomeRows, 'CASH') - sumByMethod(outflowRows, 'CASH')
	const cardIn =
		sumByMethod(incomeRows, 'CARD') - sumByMethod(outflowRows, 'CARD')
	const transferIn =
		sumByMethod(incomeRows, 'TRANSFER') -
		sumByMethod(outflowRows, 'TRANSFER')

	const obligationsKopecks = confirmedAccruals.reduce((sum, accrual) => {
		const paid = accrual.payouts.reduce((s, p) => s + p.amount, 0)
		return sum + Math.max(0, accrual.amount - paid)
	}, 0)

	let totalDebtKopecks = 0
	let debtorCount = 0
	for (const student of students) {
		const charges = student.tuitionCharges.reduce((s, c) => s + c.amount, 0)
		const paid = student.tuitionPayments.reduce((s, p) => s + p.amount, 0)
		const balance = paid - charges
		if (balance < 0) {
			totalDebtKopecks += Math.abs(balance)
			debtorCount += 1
		}
	}

	return {
		balanceKopecks,
		cashBalanceKopecks: cashIn,
		cardBalanceKopecks: cardIn,
		transferBalanceKopecks: transferIn,
		obligationsKopecks,
		monthIncomeKopecks: monthPayments.reduce((s, p) => s + p.amount, 0),
		monthChargedKopecks: monthChargesAgg._sum.amount ?? 0,
		totalDebtKopecks,
		debtorCount,
	}
}
