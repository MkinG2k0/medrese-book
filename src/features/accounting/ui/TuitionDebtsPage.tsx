'use client'

import { Input, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'

import type { TuitionDebtRow } from '@/features/accounting/lib/map-tuition-debt-rows'
import { formatMoney } from '@/shared/lib/money'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

interface TuitionDebtsPageProps {
	rows: TuitionDebtRow[]
	className?: string
}

export function TuitionDebtsPage({
	rows,
	className,
}: TuitionDebtsPageProps) {
	const [search, setSearch] = useState('')

	const filteredRows = useMemo(() => {
		const query = search.trim().toLocaleLowerCase('ru')
		if (!query) return rows
		return rows.filter((row) =>
			row.studentName.toLocaleLowerCase('ru').includes(query),
		)
	}, [rows, search])

	const columns: ColumnsType<TuitionDebtRow> = useMemo(
		() => [
			{
				title: 'Ученик',
				dataIndex: 'studentName',
			},
			{
				title: 'Опекун',
				dataIndex: 'parentName',
				render: (value: string | null) => value ?? '—',
			},
			{
				title: 'Месяц',
				dataIndex: 'month',
			},
			{
				title: 'Начислено',
				dataIndex: 'chargeKopecks',
				render: (value: number) => formatMoney(value),
			},
			{
				title: 'Оплачено',
				dataIndex: 'paidKopecks',
				render: (value: number) => formatMoney(value),
			},
			{
				title: 'Долг',
				dataIndex: 'debtKopecks',
				render: (value: number) => (
					<Text type="danger">{formatMoney(value)}</Text>
				),
			},
		],
		[],
	)

	return (
		<div className={className ? `flex flex-col gap-4 ${className}` : 'flex flex-col gap-4'}>
			<div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<Title level={3} className="!mb-0">
						Долги
					</Title>
					<Text type="secondary">
						Непокрытые начисления по месяцам (учёт по месяцу оплаты)
					</Text>
				</div>
				<Input.Search
					allowClear
					placeholder="Поиск по ученику"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					style={{ maxWidth: 280 }}
				/>
			</div>

			<Table
				rowKey="key"
				columns={columns}
				dataSource={filteredRows}
				scroll={{ x: 'max-content' }}
				pagination={{ pageSize: 50 }}
				locale={{ emptyText: 'Нет долгов по месяцам' }}
			/>
		</div>
	)
}
