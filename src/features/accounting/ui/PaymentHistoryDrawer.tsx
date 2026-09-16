'use client'

import { App, Button, Drawer, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { getPaymentMethodLabel } from '@/features/accounting/lib/accounting-labels'
import { formatMoney } from '@/shared/lib/money'

type HistoryItem = {
	id: string
	date: string
	amountKopecks: number
	method: string
	methodLabel: string
	comment: string | null
	createdByName: string
	isReversal: boolean
	canReverse: boolean
}

type HistoryPayload = {
	studentId: string
	studentName: string
	items: HistoryItem[]
}

type PaymentHistoryDrawerProps = {
	studentId: string | null
	open: boolean
	onClose: () => void
}

export function PaymentHistoryDrawer({
	studentId,
	open,
	onClose,
}: PaymentHistoryDrawerProps) {
	const { message, modal } = App.useApp()
	const queryClient = useQueryClient()
	const [reversingId, setReversingId] = useState<string | null>(null)

	const { data, isLoading } = useQuery<HistoryPayload>({
		queryKey: ['accounting-payment-history', studentId],
		enabled: open && Boolean(studentId),
		queryFn: async () => {
			const res = await fetch(
				`/api/accounting/payments/history?studentId=${encodeURIComponent(studentId!)}`,
			)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})

	const handleReverse = (paymentId: string) => {
		modal.confirm({
			title: 'Сторнировать платёж?',
			content: (
				<input
					id="payment-reverse-comment"
					className="mt-3 w-full rounded border px-3 py-2"
					placeholder="Причина сторно"
				/>
			),
			okText: 'Сторнировать',
			cancelText: 'Отмена',
			onOk: async () => {
				const input = document.getElementById(
					'payment-reverse-comment',
				) as HTMLInputElement | null
				const comment = input?.value.trim() ?? ''
				if (!comment) {
					message.error('Укажите комментарий')
					throw new Error('comment required')
				}
				setReversingId(paymentId)
				try {
					const res = await fetch(
						`/api/accounting/payments/${paymentId}/reverse`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ comment }),
						},
					)
					const json = await res.json()
					if (json.error) throw new Error(json.error)
					message.success('Сторно проведено')
					await queryClient.invalidateQueries({
						queryKey: ['accounting-payment-history', studentId],
					})
					await queryClient.invalidateQueries({
						queryKey: ['accounting-payments'],
					})
					await queryClient.invalidateQueries({
						queryKey: ['accounting-dashboard'],
					})
				} finally {
					setReversingId(null)
				}
			},
		})
	}

	const columns: ColumnsType<HistoryItem> = [
		{
			title: 'Дата',
			key: 'date',
			render: (_, row) => new Date(row.date).toLocaleDateString('ru-RU'),
		},
		{
			title: 'Сумма',
			key: 'amount',
			render: (_, row) => formatMoney(row.amountKopecks),
		},
		{
			title: 'Способ',
			key: 'method',
			render: (_, row) => row.methodLabel || getPaymentMethodLabel(row.method as never),
		},
		{ title: 'Комментарий', dataIndex: 'comment', key: 'comment' },
		{ title: 'Кто', dataIndex: 'createdByName', key: 'createdByName' },
		{
			title: '',
			key: 'actions',
			render: (_, row) =>
				row.canReverse ? (
					<Button
						size="small"
						loading={reversingId === row.id}
						onClick={() => handleReverse(row.id)}
					>
						Сторнировать
					</Button>
				) : row.isReversal ? (
					<span className="text-xs opacity-60">Сторно</span>
				) : null,
		},
	]

	return (
		<Drawer
			title={
				data?.studentName
					? `Платежи: ${data.studentName}`
					: 'История платежей'
			}
			open={open}
			onClose={onClose}
			width={720}
			destroyOnHidden
		>
			<Table
				rowKey="id"
				loading={isLoading}
				columns={columns}
				dataSource={data?.items ?? []}
				pagination={{ pageSize: 20 }}
				size="small"
			/>
		</Drawer>
	)
}
