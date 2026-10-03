'use client'

import {
	App,
	Badge,
	Button,
	DatePicker,
	Input,
	Modal,
	Select,
	Space,
	Table,
	Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
	confirmTuitionPaymentRequest,
	rejectTuitionPaymentRequest,
	type AccountantPaymentRequestRow,
} from '@/features/accounting/actions/payment-request-actions'
import { PAYMENT_METHOD_OPTIONS } from '@/features/accounting/lib/accounting-labels'
import { formatMoney } from '@/shared/lib/money'
import type { PaymentMethod } from '@/shared/lib/prisma'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type PaymentRequestsPageProps = {
	requests: AccountantPaymentRequestRow[]
}

export function PaymentRequestsPage({ requests }: PaymentRequestsPageProps) {
	const router = useRouter()
	const { message, modal } = App.useApp()
	const [isPending, startTransition] = useTransition()
	const [operationDate, setOperationDate] = useState<Dayjs>(() => dayjs())
	const [method, setMethod] = useState<PaymentMethod>('TRANSFER')
	const [rejectOpen, setRejectOpen] = useState(false)
	const [rejectRequestId, setRejectRequestId] = useState<string | null>(null)
	const [rejectReason, setRejectReason] = useState('')

	const columns: ColumnsType<AccountantPaymentRequestRow> = useMemo(
		() => [
			{
				title: 'Дата',
				dataIndex: 'createdAt',
				render: (value: string) =>
					new Date(value).toLocaleString('ru-RU', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
					}),
			},
			{
				title: 'Опекун',
				dataIndex: 'parentName',
				render: (name: string, row) => (
					<div className="flex flex-col">
						<span>{name}</span>
						{row.parentPhone ? (
							<Text type="secondary">{row.parentPhone}</Text>
						) : null}
					</div>
				),
			},
			{
				title: 'Дети / суммы',
				key: 'lines',
				render: (_: unknown, row) =>
					row.lines
						.map(
							(line) =>
								`${line.studentName}: ${formatMoney(line.amountKopecks)}`,
						)
						.join('; '),
			},
			{
				title: 'Итого',
				dataIndex: 'totalKopecks',
				render: (value: number) => formatMoney(value),
			},
			{
				title: 'Статус',
				key: 'status',
				render: () => <Tag color="processing">Ожидает</Tag>,
			},
			{
				title: '',
				key: 'actions',
				render: (_: unknown, row) => (
					<Space wrap>
						<Button
							type="primary"
							loading={isPending}
							onClick={() => {
								modal.confirm({
									title: 'Подтвердить заявку целиком?',
									content: `Будут созданы платежи на ${formatMoney(row.totalKopecks)} за ${row.lines.length} дет.`,
									okText: 'Подтвердить',
									cancelText: 'Отмена',
									onOk: () =>
										new Promise<void>((resolve, reject) => {
											startTransition(async () => {
												const result = await confirmTuitionPaymentRequest({
													requestId: row.id,
													date: operationDate.format('YYYY-MM-DD'),
													method,
												})
												if (!result.ok) {
													message.error(result.error)
													reject(new Error(result.error))
													return
												}
												message.success('Заявка подтверждена')
												router.refresh()
												resolve()
											})
										}),
								})
							}}
						>
							Подтвердить
						</Button>
						<Button
							danger
							loading={isPending}
							onClick={() => {
								setRejectRequestId(row.id)
								setRejectReason('')
								setRejectOpen(true)
							}}
						>
							Отклонить
						</Button>
					</Space>
				),
			},
		],
		[isPending, message, method, modal, operationDate, router],
	)

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<div className="mb-1 flex items-center gap-2">
						<Title level={3} className="!mb-0">
							Заявки на оплату
						</Title>
						{requests.length > 0 ? (
							<Badge count={requests.length} overflowCount={99} />
						) : null}
					</div>
					<Text type="secondary">
						Подтверждение создаёт платежи по всем детям заявки сразу
					</Text>
				</div>
				<Space wrap>
					<DatePicker
						value={operationDate}
						onChange={(value) => value && setOperationDate(value)}
						allowClear={false}
						format="DD.MM.YYYY"
					/>
					<Select
						value={method}
						onChange={setMethod}
						options={PAYMENT_METHOD_OPTIONS}
						style={{ width: 160 }}
					/>
				</Space>
			</div>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={requests}
				loading={isPending}
				pagination={false}
				locale={{ emptyText: 'Нет ожидающих заявок' }}
			/>

			<Modal
				title="Отклонить заявку"
				open={rejectOpen}
				okText="Отклонить"
				okButtonProps={{ danger: true, loading: isPending }}
				cancelText="Отмена"
				onCancel={() => setRejectOpen(false)}
				onOk={() => {
					if (!rejectRequestId) return
					if (!rejectReason.trim()) {
						message.error('Укажите причину')
						return Promise.reject()
					}
					return new Promise<void>((resolve, reject) => {
						startTransition(async () => {
							const result = await rejectTuitionPaymentRequest({
								requestId: rejectRequestId,
								reason: rejectReason.trim(),
							})
							if (!result.ok) {
								message.error(result.error)
								reject(new Error(result.error))
								return
							}
							message.success('Заявка отклонена')
							setRejectOpen(false)
							router.refresh()
							resolve()
						})
					})
				}}
			>
				<Input.TextArea
					rows={3}
					value={rejectReason}
					onChange={(event) => setRejectReason(event.target.value)}
					placeholder="Причина отклонения"
				/>
			</Modal>
		</div>
	)
}
