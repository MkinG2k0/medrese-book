'use client'

import { DatePicker, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'

import { useOperationsLedger, type LedgerEntry } from '@/entities/accounting'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

const TYPE_OPTIONS = [
	{ value: '', label: 'Все типы' },
	{ value: 'payment', label: 'Платежи' },
	{ value: 'expense', label: 'Расходы' },
	{ value: 'donation', label: 'Пожертвования' },
	{ value: 'salary_payout', label: 'Выплаты ЗП' },
	{ value: 'charge', label: 'Начисления' },
	{ value: 'salary_accrual', label: 'Начисления ЗП' },
]

export function OperationsLedgerPage() {
	const [from, setFrom] = useState(dayjs().startOf('month'))
	const [to, setTo] = useState(dayjs())
	const [type, setType] = useState('')
	const { data, isLoading } = useOperationsLedger({
		from: from.format('YYYY-MM-DD'),
		to: to.format('YYYY-MM-DD'),
		type: type || undefined,
	})

	const columns: ColumnsType<LedgerEntry> = [
		{
			title: 'Дата',
			key: 'date',
			render: (_, row) => new Date(row.date).toLocaleString('ru-RU'),
		},
		{ title: 'Тип', dataIndex: 'type', key: 'type' },
		{ title: 'Описание', dataIndex: 'label', key: 'label' },
		{
			title: 'Сумма',
			key: 'amount',
			render: (_, row) => formatMoney(row.amountKopecks),
		},
		{ title: 'Комментарий', dataIndex: 'comment', key: 'comment' },
		{ title: 'Автор', dataIndex: 'createdBy', key: 'createdBy' },
	]

	return (
		<div className="flex flex-col gap-6">
			<Title level={3}>Журнал операций</Title>
			<div className="flex flex-wrap gap-3">
				<DatePicker value={from} onChange={(value) => value && setFrom(value)} />
				<DatePicker value={to} onChange={(value) => value && setTo(value)} />
				<Select
					value={type}
					onChange={setType}
					options={TYPE_OPTIONS}
					className="min-w-48"
				/>
			</div>
			<Table
				rowKey="id"
				loading={isLoading}
				columns={columns}
				dataSource={data ?? []}
				pagination={{ pageSize: 50 }}
			/>
		</div>
	)
}
