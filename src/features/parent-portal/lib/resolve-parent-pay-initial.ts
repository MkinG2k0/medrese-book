import type { ParentPaymentChild } from '@/features/parent-portal/actions/parent-payment-actions'

import { loadParentPayDraft } from './parent-pay-draft'
import {
	buildParentMonthFlags,
	pickDefaultParentMonth,
	type ChildMonthLedger,
	type ParentMonthOption,
} from './unpaid-months'

function toLedgers(children: ParentPaymentChild[]): ChildMonthLedger[] {
	return children.map((child) => ({
		studentId: child.studentId,
		tuitionRateKopecks: child.tuitionRateKopecks,
		chargesByMonth: child.chargesByMonth,
		paidByMonth: child.paidByMonth,
	}))
}

export function resolveParentPayInitial(input: {
	parentUserId: string
	paymentChildren: ParentPaymentChild[]
	monthKeys: string[]
	currentMonth: string
}): {
	selectedIds: string[]
	amounts: Record<string, number | null>
	month: string
	monthOptions: ParentMonthOption[]
} {
	const { parentUserId, paymentChildren, monthKeys, currentMonth } = input
	const draft = loadParentPayDraft(parentUserId)
	const defaultAmounts = Object.fromEntries(
		paymentChildren.map((child) => [
			child.studentId,
			child.tuitionRateKopecks,
		]),
	)
	const draftSelected = draft
		? draft.selectedStudentIds.filter((id) =>
				paymentChildren.some((child) => child.studentId === id),
			)
		: []
	const selectedIds =
		draftSelected.length > 0
			? draftSelected
			: paymentChildren.map((child) => child.studentId)

	const monthOptions = buildParentMonthFlags({
		months: monthKeys,
		selectedStudentIds: selectedIds,
		children: toLedgers(paymentChildren),
	})
	const defaultMonth = pickDefaultParentMonth(monthOptions, currentMonth)

	return {
		selectedIds,
		amounts: draft
			? {
					...defaultAmounts,
					...Object.fromEntries(
						Object.entries(draft.amountsKopecks).filter(([id]) =>
							paymentChildren.some((child) => child.studentId === id),
						),
					),
				}
			: defaultAmounts,
		month:
			draft?.month && monthKeys.includes(draft.month)
				? draft.month
				: defaultMonth,
		monthOptions,
	}
}

export { toLedgers }
