import { monthKeyToDateRange } from '@/shared/lib/accounting/month'
import { prisma } from '@/shared/lib/prisma'

import {
	computeStudentBalanceKopecks,
	resolveStudentPaymentStatus,
} from './compute-student-balance'

export type StudentPaymentRow = {
	studentId: string
	studentName: string
	groupName: string
	tuitionRateKopecks: number
	discountReason: string | null
	monthPaidKopecks: number
	monthChargeKopecks: number
	balanceKopecks: number
	status: ReturnType<typeof resolveStudentPaymentStatus>
}

export async function queryStudentPaymentsForMonth(
	month: string,
	options: { debtorsOnly?: boolean } = {},
): Promise<StudentPaymentRow[]> {
	const { start, end } = monthKeyToDateRange(month)

	const students = await prisma.student.findMany({
		where: { status: 'ACTIVE' },
		include: {
			user: { select: { name: true } },
			group: { select: { name: true } },
			tuitionCharges: { select: { month: true, amount: true } },
			tuitionPayments: { select: { date: true, amount: true } },
		},
		orderBy: { user: { name: 'asc' } },
	})

	const rows = students.map((student) => {
		const totalCharges = student.tuitionCharges.reduce(
			(sum, charge) => sum + charge.amount,
			0,
		)
		const totalPayments = student.tuitionPayments.reduce(
			(sum, payment) => sum + payment.amount,
			0,
		)
		const monthChargeKopecks =
			student.tuitionCharges.find((charge) => charge.month === month)
				?.amount ?? student.tuitionRate
		const monthPaidKopecks = student.tuitionPayments
			.filter((payment) => payment.date >= start && payment.date <= end)
			.reduce((sum, payment) => sum + payment.amount, 0)
		const balanceKopecks = computeStudentBalanceKopecks(
			totalPayments,
			totalCharges,
		)

		return {
			studentId: student.id,
			studentName: student.fullName ?? student.user.name,
			groupName: student.group.name,
			tuitionRateKopecks: student.tuitionRate,
			discountReason: student.discountReason,
			monthPaidKopecks,
			monthChargeKopecks,
			balanceKopecks,
			status: resolveStudentPaymentStatus(
				balanceKopecks,
				monthChargeKopecks,
				monthPaidKopecks,
			),
		}
	})

	if (options.debtorsOnly) {
		return rows.filter((row) => row.balanceKopecks < 0)
	}

	return rows
}
