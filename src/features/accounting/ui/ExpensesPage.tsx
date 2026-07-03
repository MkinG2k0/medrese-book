'use client'

import { PlusOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Modal, Select, Table, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
	EXPENSE_CATEGORY_OPTIONS,
	getExpenseCategoryLabel,
	getPaymentMethodLabel,
	PAYMENT_METHOD_OPTIONS,
} from '@/features/accounting/lib/accounting-labels'
import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

type ExpenseRow = {
	id: string
	date: string
	amount: number
	category: string
	method: string
	comment: string | null
	createdBy: { name: string }
	reversalOfId: string | null
}

type DonationRow = {
	id: string
	date: string
	amount: number
	method: string
	comment: string | null
	createdBy: { name: string }
	reversalOfId: string | null
}

export function ExpensesPage() {
	const { message, modal } = App.useApp()
	const queryClient = useQueryClient()
	const [expenseModal, setExpenseModal] = useState(false)
	const [donationModal, setDonationModal] = useState(false)
	const [amountKopecks, setAmountKopecks] = useState<number | null>(null)
	const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH')
	const [category, setCategory] = useState<
		'SUPPLIES' | 'UTILITIES' | 'RENT' | 'OTHER'
	>('OTHER')
	const [comment, setComment] = useState('')
	const [date, setDate] = useState(dayjs())
	const [submitting, setSubmitting] = useState(false)

	const { data: expenses, isLoading: expensesLoading } = useQuery<ExpenseRow[]>({
		queryKey: ['accounting-expenses'],
		queryFn: async () => {
			const res = await fetch('/api/accounting/expenses')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})

	const { data: donations, isLoading: donationsLoading } = useQuery<
		DonationRow[]
	>({
		queryKey: ['accounting-donations'],
		queryFn: async () => {
			const res = await fetch('/api/accounting/donations')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})

	const expenseColumns: ColumnsType<ExpenseRow> = [
		{
			title: 'Дата',
			key: 'date',
			render: (_, row) => new Date(row.date).toLocaleDateString('ru-RU'),
		},
		{
			title: 'Категория',
			key: 'category',
			render: (_, row) => getExpenseCategoryLabel(row.category as never),
		},
		{
			title: 'Сумма',
			key: 'amount',
			render: (_, row) => formatMoney(row.amount),
		},
		{
			title: 'Способ',
			key: 'method',
			render: (_, row) => getPaymentMethodLabel(row.method as never),
		},
		{ title: 'Комментарий', dataIndex: 'comment', key: 'comment' },
		{
			title: '',
			key: 'reverse',
			render: (_, row) =>
				row.amount > 0 && !row.reversalOfId ? (
					<Button size="small" onClick={() => void handleReverse('expense', row.id)}>
						Сторнировать
					</Button>
				) : null,
		},
	]

	const donationColumns: ColumnsType<DonationRow> = [
		{
			title: 'Дата',
			key: 'date',
			render: (_, row) => new Date(row.date).toLocaleDateString('ru-RU'),
		},
		{
			title: 'Сумма',
			key: 'amount',
			render: (_, row) => formatMoney(row.amount),
		},
		{
			title: 'Способ',
			key: 'method',
			render: (_, row) => getPaymentMethodLabel(row.method as never),
		},
		{ title: 'Комментарий', dataIndex: 'comment', key: 'comment' },
		{
			title: '',
			key: 'reverse',
			render: (_, row) =>
				row.amount > 0 && !row.reversalOfId ? (
					<Button size="small" onClick={() => void handleReverse('donation', row.id)}>
						Сторнировать
					</Button>
				) : null,
		},
	]

	const handleReverse = (kind: 'expense' | 'donation', id: string) => {
		modal.confirm({
			title: 'Сторнировать запись?',
			content: (
				<input
					id="reverse-comment"
					className="mt-3 w-full rounded border px-3 py-2"
					placeholder="Причина сторно"
				/>
			),
			okText: 'Сторнировать',
			cancelText: 'Отмена',
			onOk: async () => {
				const input = document.getElementById(
					'reverse-comment',
				) as HTMLInputElement | null
				const reverseComment = input?.value.trim() ?? ''
				if (!reverseComment) {
					message.error('Укажите комментарий')
					throw new Error('comment required')
				}
				const res = await fetch(`/api/accounting/${kind}s/${id}/reverse`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ comment: reverseComment }),
				})
				const json = await res.json()
				if (json.error) throw new Error(json.error)
				message.success('Сторно проведено')
				await queryClient.invalidateQueries({ queryKey: ['accounting-expenses'] })
				await queryClient.invalidateQueries({ queryKey: ['accounting-donations'] })
			},
		})
	}

	const submitRecord = async (kind: 'expense' | 'donation') => {
		if (amountKopecks == null) {
			message.error('Укажите сумму')
			return
		}
		setSubmitting(true)
		try {
			const payload =
				kind === 'expense'
					? {
							date: date.format('YYYY-MM-DD'),
							amountKopecks,
							method,
							category,
							comment: comment || undefined,
						}
					: {
							date: date.format('YYYY-MM-DD'),
							amountKopecks,
							method,
							comment: comment || undefined,
						}
			const res = await fetch(`/api/accounting/${kind}s`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			message.success('Сохранено')
			setExpenseModal(false)
			setDonationModal(false)
			setAmountKopecks(null)
			setComment('')
			await queryClient.invalidateQueries({
				queryKey: [`accounting-${kind}s`],
			})
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка')
		} finally {
			setSubmitting(false)
		}
	}

	const formFields = (
		<div className="flex flex-col gap-4">
			<DatePicker value={date} onChange={(value) => value && setDate(value)} />
			<MoneyInput valueKopecks={amountKopecks} onChangeKopecks={setAmountKopecks} />
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
	)

	return (
		<div className="flex flex-col gap-6">
			<Title level={3}>Расходы и пожертвования</Title>
			<Tabs
				items={[
					{
						key: 'expenses',
						label: 'Расходы',
						children: (
							<>
								<div className="mb-4">
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => setExpenseModal(true)}
									>
										Расход
									</Button>
								</div>
								<Table
									rowKey="id"
									loading={expensesLoading}
									columns={expenseColumns}
									dataSource={expenses ?? []}
								/>
							</>
						),
					},
					{
						key: 'donations',
						label: 'Пожертвования',
						children: (
							<>
								<div className="mb-4">
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => setDonationModal(true)}
									>
										Пожертвование
									</Button>
								</div>
								<Table
									rowKey="id"
									loading={donationsLoading}
									columns={donationColumns}
									dataSource={donations ?? []}
								/>
							</>
						),
					},
				]}
			/>

			<Modal
				title="Новый расход"
				open={expenseModal}
				onCancel={() => setExpenseModal(false)}
				onOk={() => void submitRecord('expense')}
				confirmLoading={submitting}
				okText="Сохранить"
				cancelText="Отмена"
			>
				{formFields}
				<Select
					value={category}
					onChange={setCategory}
					options={EXPENSE_CATEGORY_OPTIONS}
					className="mt-4 w-full"
				/>
			</Modal>

			<Modal
				title="Новое пожертвование"
				open={donationModal}
				onCancel={() => setDonationModal(false)}
				onOk={() => void submitRecord('donation')}
				confirmLoading={submitting}
				okText="Сохранить"
				cancelText="Отмена"
			>
				{formFields}
			</Modal>
		</div>
	)
}
