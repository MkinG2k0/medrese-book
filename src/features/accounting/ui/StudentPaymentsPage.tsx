'use client'

import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Checkbox, Modal, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
	useStudentPayments,
	type StudentPaymentRow,
} from '@/entities/accounting'
import { PAYMENT_METHOD_OPTIONS } from '@/features/accounting/lib/accounting-labels'
import {
	AccountingMonthPicker,
} from '@/features/accounting/ui/AccountingMonthPicker'
import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

type StudentPaymentsPageProps = {
	month: string
}

function renderStatus(status: StudentPaymentRow['status']) {
	switch (status.kind) {
		case 'paid':
			return <Tag color="success">Оплачено</Tag>
		case 'partial':
			return (
				<Tag color="warning">
					Частично ({formatMoney(status.debtKopecks)})
				</Tag>
			)
		case 'debt':
			return (
				<Tag color="error">
					Долг {status.debtMonths} мес. ({formatMoney(status.debtKopecks)})
				</Tag>
			)
		case 'advance':
			return (
				<Tag color="processing">Аванс ({formatMoney(status.advanceKopecks)})</Tag>
			)
	}
}

export function StudentPaymentsPage({ month }: StudentPaymentsPageProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const [debtorsOnly, setDebtorsOnly] = useState(false)
	const { data, isLoading } = useStudentPayments(month, debtorsOnly)
	const [modalOpen, setModalOpen] = useState(false)
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
	const [amountKopecks, setAmountKopecks] = useState<number | null>(null)
	const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH')
	const [comment, setComment] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const columns: ColumnsType<StudentPaymentRow> = useMemo(
		() => [
			{ title: 'Ученик', dataIndex: 'studentName', key: 'studentName' },
			{ title: 'Группа', dataIndex: 'groupName', key: 'groupName' },
			{
				title: 'Тариф',
				key: 'tuitionRateKopecks',
				render: (_, row) => formatMoney(row.tuitionRateKopecks),
			},
			{
				title: 'Оплачено',
				key: 'monthPaidKopecks',
				render: (_, row) => formatMoney(row.monthPaidKopecks),
			},
			{
				title: 'Сальдо',
				key: 'balanceKopecks',
				render: (_, row) => formatMoney(row.balanceKopecks),
			},
			{
				title: 'Статус',
				key: 'status',
				render: (_, row) => renderStatus(row.status),
			},
			{
				title: '',
				key: 'actions',
				render: (_, row) => (
					<Button
						size="small"
						onClick={() => {
							setSelectedStudentId(row.studentId)
							setModalOpen(true)
						}}
					>
						+ Платёж
					</Button>
				),
			},
		],
		[],
	)

	const handleSubmit = async () => {
		if (!selectedStudentId || amountKopecks == null) {
			message.error('Заполните сумму')
			return
		}
		setSubmitting(true)
		try {
			const res = await fetch('/api/accounting/payments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					studentId: selectedStudentId,
					date: dayjs().format('YYYY-MM-DD'),
					amountKopecks,
					method,
					comment: comment || undefined,
				}),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			message.success('Платёж сохранён')
			setModalOpen(false)
			setAmountKopecks(null)
			setComment('')
			await queryClient.invalidateQueries({ queryKey: ['accounting-payments'] })
			await queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] })
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка сохранения')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3}>Платежи учеников</Title>
				<div className="flex flex-wrap items-center gap-3">
					<AccountingMonthPicker month={month} />
					<Checkbox
						checked={debtorsOnly}
						onChange={(event) => setDebtorsOnly(event.target.checked)}
					>
						Только должники
					</Checkbox>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setSelectedStudentId(null)
							setModalOpen(true)
						}}
					>
						Платёж
					</Button>
				</div>
			</div>

			<Table
				rowKey="studentId"
				loading={isLoading}
				columns={columns}
				dataSource={data ?? []}
				pagination={{ pageSize: 50 }}
			/>

			<Modal
				title="Новый платёж"
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				onOk={() => void handleSubmit()}
				confirmLoading={submitting}
				okText="Сохранить"
				cancelText="Отмена"
			>
				<div className="flex flex-col gap-4">
					<Select
						showSearch
						placeholder="Ученик"
						value={selectedStudentId ?? undefined}
						onChange={setSelectedStudentId}
						options={(data ?? []).map((row) => ({
							value: row.studentId,
							label: row.studentName,
						}))}
						className="w-full"
					/>
					<MoneyInput
						valueKopecks={amountKopecks}
						onChangeKopecks={setAmountKopecks}
					/>
					<Select
						value={method}
						onChange={setMethod}
						options={PAYMENT_METHOD_OPTIONS}
						className="w-full"
					/>
					<input
						className="w-full rounded border px-3 py-2"
						placeholder="Комментарий"
						value={comment}
						onChange={(event) => setComment(event.target.value)}
					/>
				</div>
			</Modal>
		</div>
	)
}
