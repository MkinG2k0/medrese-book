'use client'

import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import {
	App,
	Button,
	Checkbox,
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
import { useEffect, useMemo, useState, type Key } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
	useStudentPayments,
	type StudentPaymentRow,
} from '@/entities/accounting'
import { PAYMENT_METHOD_OPTIONS } from '@/features/accounting/lib/accounting-labels'
import {
	loadLastPaymentMethod,
	saveLastPaymentMethod,
} from '@/features/accounting/lib/payment-method-storage'
import {
	debtKopecks,
	remainingToMonthChargeKopecks,
	suggestPaymentAmountKopecks,
} from '@/features/accounting/lib/payment-suggestions'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import { PaymentHistoryDrawer } from '@/features/accounting/ui/PaymentHistoryDrawer'
import { monthKeyToDateRange } from '@/shared/lib/accounting/month'
import { formatMoney } from '@/shared/lib/money'
import type { PaymentMethod } from '@/shared/lib/prisma'
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
	const { message, modal } = App.useApp()
	const queryClient = useQueryClient()
	const [debtorsOnly, setDebtorsOnly] = useState(false)
	const [groupFilter, setGroupFilter] = useState<string | null>(null)
	const [search, setSearch] = useState('')
	const { data, isLoading } = useStudentPayments(month, debtorsOnly)

	const [operationDate, setOperationDate] = useState<Dayjs>(() => dayjs())
	const [method, setMethod] = useState<PaymentMethod>('CASH')
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
	const [inlineAmounts, setInlineAmounts] = useState<Record<string, number | null>>(
		{},
	)
	const [busyStudentId, setBusyStudentId] = useState<string | null>(null)
	const [batchSubmitting, setBatchSubmitting] = useState(false)
	const [exporting, setExporting] = useState(false)

	const [modalOpen, setModalOpen] = useState(false)
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
	const [amountKopecks, setAmountKopecks] = useState<number | null>(null)
	const [comment, setComment] = useState('')
	const [modalDate, setModalDate] = useState<Dayjs>(() => dayjs())
	const [submitting, setSubmitting] = useState(false)

	const [historyStudentId, setHistoryStudentId] = useState<string | null>(null)

	useEffect(() => {
		setMethod(loadLastPaymentMethod('CASH'))
	}, [])

	const groupOptions = useMemo(() => {
		const names = new Set((data ?? []).map((row) => row.groupName).filter(Boolean))
		return [...names].sort((a, b) => a.localeCompare(b, 'ru')).map((name) => ({
			value: name,
			label: name,
		}))
	}, [data])

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase()
		return (data ?? []).filter((row) => {
			if (groupFilter && row.groupName !== groupFilter) return false
			if (!query) return true
			return (
				row.studentName.toLowerCase().includes(query) ||
				row.groupName.toLowerCase().includes(query) ||
				(row.discountReason?.toLowerCase().includes(query) ?? false)
			)
		})
	}, [data, groupFilter, search])

	const rowById = useMemo(() => {
		const map = new Map<string, StudentPaymentRow>()
		for (const row of data ?? []) map.set(row.studentId, row)
		return map
	}, [data])

	const invalidatePayments = async () => {
		await queryClient.invalidateQueries({ queryKey: ['accounting-payments'] })
		await queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] })
	}

	const postPayment = async (payload: {
		studentId: string
		amountKopecks: number
		date: string
		method: PaymentMethod
		comment?: string
	}) => {
		const res = await fetch('/api/accounting/payments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
		const json = await res.json()
		if (json.error) throw new Error(json.error)
		saveLastPaymentMethod(payload.method)
		setMethod(payload.method)
	}

	const quickPay = async (
		row: StudentPaymentRow,
		kind: 'tariff' | 'debt',
	) => {
		const amount =
			kind === 'tariff'
				? remainingToMonthChargeKopecks(row)
				: debtKopecks(row)
		if (amount <= 0) {
			message.info(
				kind === 'tariff'
					? 'За месяц уже оплачено не меньше тарифа'
					: 'Долга нет',
			)
			return
		}
		setBusyStudentId(row.studentId)
		try {
			await postPayment({
				studentId: row.studentId,
				amountKopecks: amount,
				date: operationDate.format('YYYY-MM-DD'),
				method,
			})
			message.success(
				kind === 'tariff'
					? `Тариф: ${formatMoney(amount)}`
					: `Долг: ${formatMoney(amount)}`,
			)
			await invalidatePayments()
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка сохранения')
		} finally {
			setBusyStudentId(null)
		}
	}

	const openPaymentModal = (row?: StudentPaymentRow) => {
		setSelectedStudentId(row?.studentId ?? null)
		setAmountKopecks(row ? suggestPaymentAmountKopecks(row) : null)
		setComment('')
		setModalDate(operationDate)
		setModalOpen(true)
	}

	const resetModalFields = (keepOpen: boolean) => {
		setAmountKopecks(null)
		setComment('')
		setSelectedStudentId(null)
		if (!keepOpen) setModalOpen(false)
	}

	const handleSubmit = async (andAnother: boolean) => {
		if (!selectedStudentId || amountKopecks == null) {
			message.error('Заполните сумму и ученика')
			return
		}
		setSubmitting(true)
		try {
			await postPayment({
				studentId: selectedStudentId,
				amountKopecks,
				date: modalDate.format('YYYY-MM-DD'),
				method,
				comment: comment || undefined,
			})
			message.success('Платёж сохранён')
			await invalidatePayments()
			if (andAnother) {
				resetModalFields(true)
			} else {
				resetModalFields(false)
			}
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка сохранения')
		} finally {
			setSubmitting(false)
		}
	}

	const handleInlineSave = async (row: StudentPaymentRow) => {
		const amount =
			inlineAmounts[row.studentId] ?? suggestPaymentAmountKopecks(row)
		if (amount == null || amount <= 0) {
			message.error('Укажите сумму')
			return
		}
		setBusyStudentId(row.studentId)
		try {
			await postPayment({
				studentId: row.studentId,
				amountKopecks: amount,
				date: operationDate.format('YYYY-MM-DD'),
				method,
			})
			message.success('Платёж сохранён')
			setInlineAmounts((prev) => ({ ...prev, [row.studentId]: null }))
			await invalidatePayments()
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка сохранения')
		} finally {
			setBusyStudentId(null)
		}
	}

	const handleBatchTariff = () => {
		const items = selectedRowKeys
			.map((key) => rowById.get(String(key)))
			.filter((row): row is StudentPaymentRow => Boolean(row))
			.map((row) => ({
				studentId: row.studentId,
				amountKopecks: remainingToMonthChargeKopecks(row),
				name: row.studentName,
			}))
			.filter((item) => item.amountKopecks > 0)

		if (items.length === 0) {
			message.info('Нет выбранных учеников с суммой к оплате')
			return
		}

		const total = items.reduce((sum, item) => sum + item.amountKopecks, 0)
		modal.confirm({
			title: `Внести тариф выбранным (${items.length})?`,
			content: `Сумма: ${formatMoney(total)}. Дата: ${operationDate.format('DD.MM.YYYY')}.`,
			okText: 'Провести',
			cancelText: 'Отмена',
			onOk: async () => {
				setBatchSubmitting(true)
				try {
					const res = await fetch('/api/accounting/payments/batch', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							date: operationDate.format('YYYY-MM-DD'),
							method,
							items: items.map(({ studentId, amountKopecks }) => ({
								studentId,
								amountKopecks,
							})),
						}),
					})
					const json = await res.json()
					if (json.error) throw new Error(json.error)
					saveLastPaymentMethod(method)
					message.success(`Создано платежей: ${json.data.count}`)
					setSelectedRowKeys([])
					await invalidatePayments()
				} catch (err) {
					message.error(err instanceof Error ? err.message : 'Ошибка')
					throw err
				} finally {
					setBatchSubmitting(false)
				}
			},
		})
	}

	const handleExport = async () => {
		setExporting(true)
		try {
			const { start, end } = monthKeyToDateRange(month)
			const from = dayjs(start).format('YYYY-MM-DD')
			const to = dayjs(end).format('YYYY-MM-DD')
			const res = await fetch(
				`/api/accounting/export/payments?from=${from}&to=${to}`,
			)
			if (!res.ok) {
				const json = await res.json().catch(() => null)
				throw new Error(json?.error ?? 'Ошибка экспорта')
			}
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `payments-${month}.xlsx`
			link.click()
			URL.revokeObjectURL(url)
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка экспорта')
		} finally {
			setExporting(false)
		}
	}

	const columns: ColumnsType<StudentPaymentRow> = useMemo(
		() => [
			{ title: 'Ученик', dataIndex: 'studentName', key: 'studentName' },
			{ title: 'Группа', dataIndex: 'groupName', key: 'groupName' },
			{
				title: 'Тариф',
				key: 'tuitionRateKopecks',
				render: (_, row) => (
					<div className="flex flex-col">
						<span>{formatMoney(row.tuitionRateKopecks)}</span>
						{row.discountReason ? (
							<span className="text-xs opacity-60">{row.discountReason}</span>
						) : null}
					</div>
				),
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
				title: 'Сумма (Enter)',
				key: 'inline',
				width: 160,
				render: (_, row) => (
					<MoneyInput
						valueKopecks={
							inlineAmounts[row.studentId] ??
							suggestPaymentAmountKopecks(row)
						}
						onChangeKopecks={(value) =>
							setInlineAmounts((prev) => ({
								...prev,
								[row.studentId]: value,
							}))
						}
						onPressEnter={() => void handleInlineSave(row)}
						placeholder="Сумма"
					/>
				),
			},
			{
				title: '',
				key: 'actions',
				width: 280,
				render: (_, row) => (
					<Space wrap size={4}>
						<Button
							size="small"
							loading={busyStudentId === row.studentId}
							onClick={() => void handleInlineSave(row)}
						>
							Внести
						</Button>
						<Button
							size="small"
							loading={busyStudentId === row.studentId}
							onClick={() => void quickPay(row, 'tariff')}
						>
							Тариф
						</Button>
						<Button
							size="small"
							disabled={debtKopecks(row) <= 0}
							loading={busyStudentId === row.studentId}
							onClick={() => void quickPay(row, 'debt')}
						>
							Долг
						</Button>
						<Button size="small" onClick={() => openPaymentModal(row)}>
							+
						</Button>
						<Button
							size="small"
							type="link"
							onClick={() => setHistoryStudentId(row.studentId)}
						>
							История
						</Button>
					</Space>
				),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- handlers use latest state via closures refreshed each render
		[busyStudentId, inlineAmounts, method, operationDate],
	)

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<Title level={3}>Платежи учеников</Title>
				<div className="flex flex-wrap items-center gap-3">
					<AccountingMonthPicker month={month} />
					<DatePicker
						value={operationDate}
						inputReadOnly
						allowClear={false}
						onChange={(value) => value && setOperationDate(value)}
						title="Дата новых платежей"
					/>
					<Select
						value={method}
						onChange={(value) => {
							setMethod(value)
							saveLastPaymentMethod(value)
						}}
						options={PAYMENT_METHOD_OPTIONS}
						style={{ width: 140 }}
					/>
					<Checkbox
						checked={debtorsOnly}
						onChange={(event) => setDebtorsOnly(event.target.checked)}
					>
						Только должники
					</Checkbox>
					<Select
						allowClear
						placeholder="Группа"
						value={groupFilter ?? undefined}
						onChange={(value) => setGroupFilter(value ?? null)}
						options={groupOptions}
						style={{ width: 180 }}
					/>
					<Input.Search
						allowClear
						placeholder="Поиск ученика"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						style={{ width: 200 }}
					/>
					<Button
						icon={<DownloadOutlined />}
						loading={exporting}
						onClick={() => void handleExport()}
					>
						Excel
					</Button>
					<Button
						loading={batchSubmitting}
						disabled={selectedRowKeys.length === 0}
						onClick={handleBatchTariff}
					>
						Тариф выбранным ({selectedRowKeys.length})
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => openPaymentModal()}
					>
						Платёж
					</Button>
				</div>
			</div>

			<Table
				rowKey="studentId"
				loading={isLoading}
				columns={columns}
				dataSource={filteredRows}
				pagination={{ pageSize: 50 }}
				rowSelection={{
					selectedRowKeys,
					onChange: setSelectedRowKeys,
				}}
				scroll={{ x: 1100 }}
			/>

			<Modal
				title="Новый платёж"
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				footer={[
					<Button key="cancel" onClick={() => setModalOpen(false)}>
						Отмена
					</Button>,
					<Button
						key="another"
						loading={submitting}
						onClick={() => void handleSubmit(true)}
					>
						Сохранить и ещё
					</Button>,
					<Button
						key="ok"
						type="primary"
						loading={submitting}
						onClick={() => void handleSubmit(false)}
					>
						Сохранить
					</Button>,
				]}
			>
				<div className="flex flex-col gap-4">
					<Select
						showSearch
						optionFilterProp="label"
						placeholder="Ученик"
						value={selectedStudentId ?? undefined}
						onChange={(studentId) => {
							setSelectedStudentId(studentId)
							const row = rowById.get(studentId)
							if (row) setAmountKopecks(suggestPaymentAmountKopecks(row))
						}}
						options={(data ?? []).map((row) => ({
							value: row.studentId,
							label: `${row.studentName} · ${row.groupName}`,
						}))}
						className="w-full"
					/>
					<DatePicker
						value={modalDate}
						inputReadOnly
						allowClear={false}
						onChange={(value) => value && setModalDate(value)}
						className="w-full"
					/>
					<div className="flex flex-wrap gap-2">
						<Button
							size="small"
							disabled={!selectedStudentId}
							onClick={() => {
								const row = selectedStudentId
									? rowById.get(selectedStudentId)
									: undefined
								if (!row) return
								const amount = remainingToMonthChargeKopecks(row)
								if (amount <= 0) {
									message.info('За месяц уже оплачено не меньше тарифа')
									return
								}
								setAmountKopecks(amount)
							}}
						>
							Тариф
						</Button>
						<Button
							size="small"
							disabled={!selectedStudentId}
							onClick={() => {
								const row = selectedStudentId
									? rowById.get(selectedStudentId)
									: undefined
								if (!row) return
								const amount = debtKopecks(row)
								setAmountKopecks(amount > 0 ? amount : null)
							}}
						>
							Долг
						</Button>
					</div>
					<MoneyInput
						valueKopecks={amountKopecks}
						onChangeKopecks={setAmountKopecks}
					/>
					<Select
						value={method}
						onChange={(value) => {
							setMethod(value)
							saveLastPaymentMethod(value)
						}}
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

			<PaymentHistoryDrawer
				studentId={historyStudentId}
				open={Boolean(historyStudentId)}
				onClose={() => setHistoryStudentId(null)}
			/>
		</div>
	)
}
