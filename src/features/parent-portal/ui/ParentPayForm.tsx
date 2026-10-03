'use client'

import { App, Button, Checkbox, Tag } from 'antd'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import {
	submitParentPaymentRequest,
	type ParentPaymentChild,
	type ParentPaymentRequestSummary,
} from '@/features/parent-portal/actions/parent-payment-actions'
import {
	clearParentPayDraft,
	loadParentPayDraft,
	saveParentPayDraft,
} from '@/features/parent-portal/lib/parent-pay-draft'
import { formatMoney } from '@/shared/lib/money'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type ParentPayFormProps = {
	parentUserId: string
	paymentChildren: ParentPaymentChild[]
	requests: ParentPaymentRequestSummary[]
}

const REQUEST_STATUS_LABELS: Record<
	ParentPaymentRequestSummary['status'],
	{ label: string; color: string }
> = {
	PENDING: { label: 'Ожидает подтверждения', color: 'processing' },
	CONFIRMED: { label: 'Подтверждена', color: 'success' },
	REJECTED: { label: 'Отклонена', color: 'error' },
}

export function ParentPayForm({
	parentUserId,
	paymentChildren,
	requests,
}: ParentPayFormProps) {
	const router = useRouter()
	const { message } = App.useApp()
	const [isPending, startTransition] = useTransition()
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [amounts, setAmounts] = useState<Record<string, number | null>>({})
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => {
		const draft = loadParentPayDraft(parentUserId)
		const defaultAmounts = Object.fromEntries(
			paymentChildren.map((child) => [
				child.studentId,
				child.tuitionRateKopecks,
			]),
		)

		if (draft) {
			const validSelected = draft.selectedStudentIds.filter((id) =>
				paymentChildren.some((child) => child.studentId === id),
			)
			setSelectedIds(
				validSelected.length > 0
					? validSelected
					: paymentChildren.map((child) => child.studentId),
			)
			setAmounts({
				...defaultAmounts,
				...Object.fromEntries(
					Object.entries(draft.amountsKopecks).filter(([id]) =>
						paymentChildren.some((child) => child.studentId === id),
					),
				),
			})
		} else {
			setSelectedIds(paymentChildren.map((child) => child.studentId))
			setAmounts(defaultAmounts)
		}
		setHydrated(true)
	}, [parentUserId, paymentChildren])

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
		})
	}, [hydrated, parentUserId, selectedIds, amounts])

	const totalKopecks = useMemo(() => {
		return selectedIds.reduce((sum, studentId) => {
			const amount = amounts[studentId]
			return sum + (typeof amount === 'number' && amount > 0 ? amount : 0)
		}, 0)
	}, [selectedIds, amounts])

	const toggleChild = (studentId: string, checked: boolean) => {
		setSelectedIds((prev) =>
			checked
				? [...new Set([...prev, studentId])]
				: prev.filter((id) => id !== studentId),
		)
	}

	const handleSubmit = () => {
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
			const result = await submitParentPaymentRequest({ lines })
			if (!result.ok) {
				message.error(result.error)
				return
			}
			clearParentPayDraft(parentUserId)
			message.success('Заявка отправлена бухгалтеру')
			router.refresh()
		})
	}

	if (paymentChildren.length === 0) {
		return (
			<Text type="secondary">
				Нет активных детей для оплаты. Обратитесь к менеджеру.
			</Text>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				{paymentChildren.map((child) => {
					const checked = selectedIds.includes(child.studentId)
					return (
						<div
							key={child.studentId}
							className="flex flex-col gap-3 rounded-lg border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="flex items-start gap-3">
								<Checkbox
									checked={checked}
									onChange={(event) =>
										toggleChild(child.studentId, event.target.checked)
									}
								/>
								<div className="flex flex-col gap-1">
									<Text strong>{child.name}</Text>
									<Text type="secondary">
										{child.groupNames.length > 0
											? child.groupNames.join(', ')
											: 'Без группы'}
										{' · '}
										тариф {formatMoney(child.tuitionRateKopecks)}
									</Text>
								</div>
							</div>
							<div className="w-full sm:w-44">
								<MoneyInput
									valueKopecks={amounts[child.studentId] ?? null}
									onChangeKopecks={(value) =>
										setAmounts((prev) => ({
											...prev,
											[child.studentId]: value,
										}))
									}
									placeholder={String(child.tuitionRateKopecks / 100)}
								/>
							</div>
						</div>
					)
				})}
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Text>
					Итого: <Text strong>{formatMoney(totalKopecks)}</Text>
					{' · '}
					выбрано {selectedIds.length} из {paymentChildren.length}
				</Text>
				<Button
					type="primary"
					size="large"
					loading={isPending}
					disabled={totalKopecks <= 0}
					onClick={handleSubmit}
				>
					Оплатить
				</Button>
			</div>

			{requests.length > 0 && (
				<div className="flex flex-col gap-3">
					<Title level={4} className="!mb-0">
						Мои заявки
					</Title>
					{requests.map((request) => {
						const status = REQUEST_STATUS_LABELS[request.status]
						return (
							<div
								key={request.id}
								className="flex flex-col gap-2 rounded-lg border border-white/10 p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Text strong>{formatMoney(request.totalKopecks)}</Text>
									<Tag color={status.color}>{status.label}</Tag>
								</div>
								<Text type="secondary">
									{new Date(request.createdAt).toLocaleString('ru-RU')}
									{' · '}
									{request.lines
										.map(
											(line) =>
												`${line.studentName}: ${formatMoney(line.amountKopecks)}`,
										)
										.join('; ')}
								</Text>
								{request.rejectReason ? (
									<Text type="danger">Причина: {request.rejectReason}</Text>
								) : null}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
