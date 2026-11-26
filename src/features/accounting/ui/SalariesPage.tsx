'use client'

import { App, Button, Input, InputNumber, Modal, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
	useSalaries,
	useTeacherLessons,
	type SalaryRow,
	type TeacherLessonRow,
} from '@/entities/accounting'
import { getSalaryStatusLabel } from '@/features/accounting/lib/accounting-labels'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import { PAYMENT_METHOD_OPTIONS } from '@/features/accounting/lib/accounting-labels'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

function formatLessonDateTime(value: string | null): string {
	if (!value) return '—'
	return new Date(value).toLocaleString('ru-RU')
}

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
	const [adjustDrafts, setAdjustDrafts] = useState<
		Record<string, { minutes: number | null; reason: string }>
	>({})
	const [adjustingSessionId, setAdjustingSessionId] = useState<string | null>(
		null,
	)

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

	const getAdjustDraft = (row: TeacherLessonRow) =>
		adjustDrafts[row.sessionId] ?? {
			minutes:
				row.durationMinutes != null && row.durationMinutes <= 480
					? row.durationMinutes
					: null,
			reason: '',
		}

	const updateAdjustDraft = (
		sessionId: string,
		patch: Partial<{ minutes: number | null; reason: string }>,
	) => {
		setAdjustDrafts((prev) => {
			const current = prev[sessionId] ?? { minutes: null, reason: '' }
			return {
				...prev,
				[sessionId]: { ...current, ...patch },
			}
		})
	}

	const handleAdjustDuration = async (row: TeacherLessonRow) => {
		const draft = getAdjustDraft(row)
		if (draft.minutes == null || draft.minutes < 1) {
			message.error('Укажите длительность в минутах')
			return
		}
		if (!draft.reason.trim()) {
			message.error('Укажите причину корректировки')
			return
		}

		setAdjustingSessionId(row.sessionId)
		try {
			const res = await fetch(
				`/api/accounting/teaching-sessions/${row.sessionId}/duration`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						adjustedMinutes: draft.minutes,
						reason: draft.reason.trim(),
					}),
				},
			)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			message.success('Длительность урока скорректирована')
			setAdjustDrafts((prev) => {
				const next = { ...prev }
				delete next[row.sessionId]
				return next
			})
			await queryClient.invalidateQueries({
				queryKey: ['accounting-teacher-lessons'],
			})
			await queryClient.invalidateQueries({ queryKey: ['accounting-salaries'] })
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка')
		} finally {
			setAdjustingSessionId(null)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex min-w-0 flex-col gap-4">
				<Title level={3} className="!mb-0">
					Зарплаты
				</Title>
				<AccountingMonthPicker month={month} />
			</div>

			<div className="min-w-0 max-w-full">
			<Table
				rowKey="accrualId"
				loading={isLoading}
				columns={columns}
				dataSource={data ?? []}
				pagination={false}
				scroll={{ x: 'max-content' }}
			/>
			</div>

			<Modal
				title="Уроки учителя"
				open={lessonsTeacherId != null}
				onCancel={() => {
					setLessonsTeacherId(null)
					setAdjustDrafts({})
				}}
				footer={null}
				width={960}
			>
				<Table
					rowKey="sessionId"
					loading={lessonsLoading}
					dataSource={lessons ?? []}
					pagination={false}
					scroll={{ x: 'max-content' }}
					columns={[
						{
							title: 'Начало',
							key: 'startedAt',
							render: (_, row) => formatLessonDateTime(row.startedAt),
						},
						{
							title: 'Конец',
							key: 'endedAt',
							render: (_, row) => formatLessonDateTime(row.endedAt),
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
						{
							title: 'Корректировка',
							key: 'adjust',
							render: (_, row) => {
								if (!row.isAnomaly) return null
								const draft = getAdjustDraft(row)
								return (
									<div className="flex min-w-64 flex-col gap-2">
										<InputNumber
											min={1}
											max={480}
											value={draft.minutes}
											onChange={(value) =>
												updateAdjustDraft(row.sessionId, {
													minutes: typeof value === 'number' ? value : null,
												})
											}
											addonAfter="мин"
											className="w-full"
										/>
										<Input
											value={draft.reason}
											onChange={(event) =>
												updateAdjustDraft(row.sessionId, {
													reason: event.target.value,
												})
											}
											placeholder="Причина корректировки"
										/>
										<Button
											size="small"
											type="primary"
											loading={adjustingSessionId === row.sessionId}
											onClick={() => void handleAdjustDuration(row)}
										>
											Исправить
										</Button>
									</div>
								)
							},
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
