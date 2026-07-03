'use client'

import { App, Button, Modal, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
	useSalaries,
	useTeacherLessons,
	type SalaryRow,
} from '@/entities/accounting'
import { getSalaryStatusLabel } from '@/features/accounting/lib/accounting-labels'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import { PAYMENT_METHOD_OPTIONS } from '@/features/accounting/lib/accounting-labels'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

type SalariesPageProps = {
	month: string
}

export function SalariesPage({ month }: SalariesPageProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const { data, isLoading } = useSalaries(month)
	const [lessonsTeacherId, setLessonsTeacherId] = useState<string | null>(null)
	const { data: lessons, isLoading: lessonsLoading } = useTeacherLessons(
		month,
		lessonsTeacherId,
	)
	const [payoutAccrual, setPayoutAccrual] = useState<SalaryRow | null>(null)
	const [payoutAmount, setPayoutAmount] = useState<number | null>(null)
	const [payoutMethod, setPayoutMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>(
		'CASH',
	)
	const [submitting, setSubmitting] = useState(false)

	const handleConfirm = useCallback(
		async (accrualId: string) => {
			try {
				const res = await fetch(
					`/api/accounting/salary-accruals/${accrualId}/confirm`,
					{ method: 'POST' },
				)
				const json = await res.json()
				if (json.error) throw new Error(json.error)
				message.success('Часы подтверждены')
				await queryClient.invalidateQueries({ queryKey: ['accounting-salaries'] })
			} catch (err) {
				message.error(err instanceof Error ? err.message : 'Ошибка')
			}
		},
		[message, queryClient],
	)

	const columns: ColumnsType<SalaryRow> = useMemo(
		() => [
			{ title: 'Учитель', dataIndex: 'teacherName', key: 'teacherName' },
			{
				title: 'Часы',
				key: 'hours',
				render: (_, row) => (
					<Button
						type="link"
						onClick={() => setLessonsTeacherId(row.teacherId)}
					>
						{row.hoursLabel}
						{row.anomalyCount > 0 ? ` ⚠ ${row.anomalyCount}` : ''}
					</Button>
				),
			},
			{
				title: 'Ставка',
				key: 'rate',
				render: (_, row) => formatMoney(row.hourlyRateKopecks ?? 0),
			},
			{
				title: 'Начислено',
				key: 'amount',
				render: (_, row) => formatMoney(row.amountKopecks),
			},
			{
				title: 'Статус',
				key: 'status',
				render: (_, row) => (
					<Tag>{getSalaryStatusLabel(row.status)}</Tag>
				),
			},
			{
				title: 'Действия',
				key: 'actions',
				render: (_, row) => (
					<div className="flex flex-wrap gap-2">
						{row.status === 'DRAFT' && (
							<Button size="small" onClick={() => void handleConfirm(row.accrualId)}>
								Подтвердить
							</Button>
						)}
						{(row.status === 'CONFIRMED' || row.status === 'DRAFT') && (
							<Button
								size="small"
								type="primary"
								onClick={() => {
									setPayoutAccrual(row)
									setPayoutAmount(row.amountKopecks)
								}}
							>
								Выплата
							</Button>
						)}
					</div>
				),
			},
		],
		[handleConfirm],
	)

	const handlePayout = async () => {
		if (!payoutAccrual || payoutAmount == null) return
		setSubmitting(true)
		try {
			const res = await fetch('/api/accounting/salary-payouts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accrualId: payoutAccrual.accrualId,
					date: dayjs().format('YYYY-MM-DD'),
					amountKopecks: payoutAmount,
					method: payoutMethod,
				}),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			message.success('Выплата проведена')
			setPayoutAccrual(null)
			await queryClient.invalidateQueries({ queryKey: ['accounting-salaries'] })
			await queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] })
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3}>Зарплаты</Title>
				<AccountingMonthPicker month={month} />
			</div>

			<Table
				rowKey="accrualId"
				loading={isLoading}
				columns={columns}
				dataSource={data ?? []}
				pagination={false}
			/>

			<Modal
				title="Уроки учителя"
				open={lessonsTeacherId != null}
				onCancel={() => setLessonsTeacherId(null)}
				footer={null}
				width={720}
			>
				<Table
					rowKey="sessionId"
					loading={lessonsLoading}
					dataSource={lessons ?? []}
					pagination={false}
					columns={[
						{
							title: 'Дата',
							key: 'date',
							render: (_, row) =>
								new Date(row.startedAt).toLocaleString('ru-RU'),
						},
						{ title: 'Группа', dataIndex: 'groupName', key: 'groupName' },
						{
							title: 'Минуты',
							dataIndex: 'durationMinutes',
							key: 'durationMinutes',
						},
						{
							title: 'Флаг',
							key: 'flag',
							render: (_, row) =>
								row.isAnomaly ? <Tag color="warning">Проверить</Tag> : null,
						},
					]}
				/>
			</Modal>

			<Modal
				title={`Выплата: ${payoutAccrual?.teacherName ?? ''}`}
				open={payoutAccrual != null}
				onCancel={() => setPayoutAccrual(null)}
				onOk={() => void handlePayout()}
				confirmLoading={submitting}
				okText="Провести"
				cancelText="Отмена"
			>
				<div className="flex flex-col gap-4">
					<MoneyInput
						valueKopecks={payoutAmount}
						onChangeKopecks={setPayoutAmount}
					/>
					<Select
						value={payoutMethod}
						onChange={setPayoutMethod}
						options={PAYMENT_METHOD_OPTIONS}
						className="w-full"
					/>
				</div>
			</Modal>
		</div>
	)
}
