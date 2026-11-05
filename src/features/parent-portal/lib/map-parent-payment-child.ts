import {
	aggregatePaidByMonth,
	chargesRecordFromRows,
	resolveEarliestChildMonth,
} from '@/features/parent-portal/lib/unpaid-months'
import { moscowMonthKey } from '@/shared/lib/moscow-date'

export type ParentPaymentChildSource = {
	id: string
	fullName: string | null
	tuitionRate: number
	createdAt: Date
	user: { name: string }
	enrollments: Array<{
		enrolledAt: Date
		group: { name: string }
	}>
	tuitionCharges: Array<{ month: string; amount: number }>
	tuitionPayments: Array<{ month: string; amount: number }>
}

export type MappedParentPaymentChild = {
	studentId: string
	name: string
	tuitionRateKopecks: number
	groupNames: string[]
	earliestMonth: string
	chargesByMonth: Record<string, number>
	paidByMonth: Record<string, number>
}

export function mapParentPaymentChild(
	child: ParentPaymentChildSource,
	currentMonth: string,
): MappedParentPaymentChild {
	const chargesByMonth = chargesRecordFromRows(child.tuitionCharges)
	const paidByMonth = aggregatePaidByMonth(child.tuitionPayments)
	const earliestMonth = resolveEarliestChildMonth({
		chargeMonths: child.tuitionCharges.map((charge) => charge.month),
		enrollmentMonthKeys: child.enrollments.map((enrollment) =>
			moscowMonthKey(enrollment.enrolledAt),
		),
		fallbackMonth: moscowMonthKey(child.createdAt),
	})

	return {
		studentId: child.id,
		name: child.fullName?.trim() || child.user.name,
		tuitionRateKopecks: child.tuitionRate,
		groupNames: child.enrollments.map((enrollment) => enrollment.group.name),
		earliestMonth: earliestMonth > currentMonth ? currentMonth : earliestMonth,
		chargesByMonth,
		paidByMonth,
	}
}
