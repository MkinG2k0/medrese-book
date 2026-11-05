'use client'

import { App } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

import type {
	ParentPaymentChild,
	ParentPaymentRequestSummary,
} from '@/features/parent-portal/actions/parent-payment-actions'
import { submitParentPaymentRequest } from '@/features/parent-portal/actions/submit-parent-payment-request'
import { moscowMonthKey } from '@/shared/lib/moscow-date'

import {
	clearParentPayDraft,
	saveParentPayDraft,
} from './parent-pay-draft'
import {
	resolveParentPayInitial,
	toLedgers,
} from './resolve-parent-pay-initial'
import {
	buildParentMonthFlags,
	buildParentMonthRange,
	type ParentMonthOption,
} from './unpaid-months'

export function useParentPayForm(input: {
	parentUserId: string
	paymentChildren: ParentPaymentChild[]
	requests: ParentPaymentRequestSummary[]
}) {
	const { parentUserId, paymentChildren, requests } = input
	const router = useRouter()
	const { message } = App.useApp()
	const [isPending, startTransition] = useTransition()
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [amounts, setAmounts] = useState<Record<string, number | null>>({})
	const [month, setMonth] = useState<string | null>(null)
	const [hydrated, setHydrated] = useState(false)

	const currentMonth = useMemo(() => moscowMonthKey(), [])
	const monthKeys = useMemo(
		() =>
			buildParentMonthRange({
				earliestMonths: paymentChildren.map((child) => child.earliestMonth),
				currentMonth,
			}),
		[paymentChildren, currentMonth],
	)

	const monthOptions: ParentMonthOption[] = useMemo(
		() =>
			buildParentMonthFlags({
				months: monthKeys,
				selectedStudentIds: selectedIds,
				children: toLedgers(paymentChildren),
			}),
		[monthKeys, selectedIds, paymentChildren],
	)

	useEffect(() => {
		const initial = resolveParentPayInitial({
			parentUserId,
			paymentChildren,
			monthKeys,
			currentMonth,
		})
		setSelectedIds(initial.selectedIds)
		setAmounts(initial.amounts)
		setMonth(initial.month)
		setHydrated(true)
	}, [parentUserId, paymentChildren, monthKeys, currentMonth])

	useEffect(() => {
		if (!hydrated) return
		saveParentPayDraft(parentUserId, {
			selectedStudentIds: selectedIds,
			amountsKopecks: Object.fromEntries(
				Object.entries(amounts).filter(
					(entry): entry is [string, number] =>
						typeof entry[1] === 'number' && entry[1] > 0,
				),
			),
			month: month ?? undefined,
		})
	}, [hydrated, parentUserId, selectedIds, amounts, month])

	const totalKopecks = useMemo(
		() =>
			selectedIds.reduce((sum, studentId) => {
				const amount = amounts[studentId]
				return sum + (typeof amount === 'number' && amount > 0 ? amount : 0)
			}, 0),
		[selectedIds, amounts],
	)

	const toggleChild = (studentId: string, checked: boolean) => {
		setSelectedIds((prev) =>
			checked
				? [...new Set([...prev, studentId])]
				: prev.filter((id) => id !== studentId),
		)
	}

	const handleSubmit = () => {
		if (!month) {
			message.error('Выберите месяц оплаты')
			return
		}
		const lines = selectedIds
			.map((studentId) => ({
				studentId,
				amountKopecks: amounts[studentId] ?? 0,
			}))
			.filter((line) => line.amountKopecks > 0)

		if (lines.length === 0) {
			message.error('Выберите хотя бы одного ребёнка и укажите сумму')
			return
		}

		startTransition(async () => {
			const result = await submitParentPaymentRequest({ month, lines })
			if (!result.ok) {
				message.error(result.error)
				return
			}
			clearParentPayDraft(parentUserId)
			message.success('Заявка отправлена бухгалтеру')
			router.refresh()
		})
	}

	return {
		amounts,
		handleSubmit,
		isPending,
		month,
		monthOptions,
		requests,
		selectedIds,
		setAmounts,
		setMonth,
		toggleChild,
		totalKopecks,
	}
}
