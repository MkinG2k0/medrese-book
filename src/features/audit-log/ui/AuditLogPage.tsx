'use client'

import { ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Select, Table, Tag } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

import {
	useAuditEvents,
	type AuditEventListItem,
	type AuditFilterOptions,
} from '@/entities/audit-event'
import { getAuditFilterOptions } from '@/features/audit-log/actions/audit-actions'
import {
	getAuditActionLabel,
	getAuditEntityTypeLabel,
} from '@/features/audit-log/lib/audit-labels'
import { AuditEventDetailModal } from '@/features/audit-log/ui/AuditEventDetailModal'
import Title from '@/shared/ui/Title'

const { RangePicker } = DatePicker

const DEFAULT_PAGE_SIZE = 50

type FilterState = {
	action?: string
	entityType?: string
	actorId?: string
	from?: string
	to?: string
}

export function AuditLogPage() {
	const [filters, setFilters] = useState<FilterState>({})
	const [draft, setDraft] = useState<FilterState>({})
	const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(
		null,
	)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
	const [filterOptions, setFilterOptions] = useState<AuditFilterOptions>({
		actions: [],
		entityTypes: [],
		actors: [],
	})
	const [selectedEvent, setSelectedEvent] = useState<AuditEventListItem | null>(
		null,
	)

	useEffect(() => {
		void getAuditFilterOptions()
			.then(setFilterOptions)
			.catch(() =>
				setFilterOptions({ actions: [], entityTypes: [], actors: [] }),
			)
	}, [])

	const { data, isLoading, refetch, isFetching } = useAuditEvents({
		...filters,
		page,
		pageSize,
	})

	const columns: ColumnsType<AuditEventListItem> = useMemo(
		() => [
			{
				title: 'Дата',
				dataIndex: 'createdAt',
				key: 'createdAt',
				width: 180,
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
				title: 'Автор',
				dataIndex: 'actorName',
				key: 'actorName',
				width: 180,
			},
			{
				title: 'Событие',
				dataIndex: 'action',
				key: 'action',
				render: (action: string) => (
					<Tag>{getAuditActionLabel(action)}</Tag>
				),
			},
			{
				title: 'Сущность',
				key: 'entity',
				render: (_, record) => (
					<span>
						{getAuditEntityTypeLabel(record.entityType)}
						<span className="ml-2 font-mono text-xs opacity-70">
							{record.entityId.slice(0, 8)}…
						</span>
					</span>
				),
			},
			{
				title: '',
				key: 'details',
				width: 120,
				render: (_, record) => (
					<Button type="link" size="small" onClick={() => setSelectedEvent(record)}>
						Подробнее
					</Button>
				),
			},
		],
		[],
	)

	const applyFilters = () => {
		setPage(1)
		setFilters({ ...draft })
	}

	const resetFilters = () => {
		setDraft({})
		setDateRange(null)
		setPage(1)
		setFilters({})
	}

	const handleDateRangeChange = (
		values: [Dayjs | null, Dayjs | null] | null,
	) => {
		setDateRange(values)
		setDraft((prev) => ({
			...prev,
			from: values?.[0]?.format('YYYY-MM-DD'),
			to: values?.[1]?.format('YYYY-MM-DD'),
		}))
	}

	const handleTableChange = (pagination: TablePaginationConfig) => {
		setPage(pagination.current ?? 1)
		setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE)
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Title level={3} className="!mb-0">
					Журнал действий
				</Title>
				<Button
					icon={<ReloadOutlined />}
					onClick={() => void refetch()}
					loading={isFetching}
				>
					Обновить
				</Button>
			</div>

			<div className="flex flex-wrap gap-3">
				<Select
					allowClear
					showSearch
					placeholder="Тип события"
					aria-label="Тип события"
					optionFilterProp="label"
					options={filterOptions.actions}
					value={draft.action}
					onChange={(value) =>
						setDraft((prev) => ({ ...prev, action: value ?? undefined }))
					}
					className="min-w-[220px]"
				/>
				<Select
					allowClear
					showSearch
					placeholder="Тип сущности"
					aria-label="Тип сущности"
					optionFilterProp="label"
					options={filterOptions.entityTypes}
					value={draft.entityType}
					onChange={(value) =>
						setDraft((prev) => ({ ...prev, entityType: value ?? undefined }))
					}
					className="min-w-[180px]"
				/>
				<Select
					allowClear
					showSearch
					placeholder="Автор"
					aria-label="Автор"
					optionFilterProp="label"
					options={filterOptions.actors}
					value={draft.actorId}
					onChange={(value) =>
						setDraft((prev) => ({ ...prev, actorId: value ?? undefined }))
					}
					className="min-w-[200px]"
				/>
				<RangePicker
					value={dateRange}
					onChange={handleDateRangeChange}
					format="DD.MM.YYYY"
					placeholder={['С', 'По']}
				/>
				<Button type="primary" onClick={applyFilters}>
					Применить
				</Button>
				<Button onClick={resetFilters}>Сбросить</Button>
			</div>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={data?.items ?? []}
				loading={isLoading}
				pagination={{
					current: page,
					pageSize,
					total: data?.total ?? 0,
					showSizeChanger: true,
					showTotal: (total) => `Всего: ${total}`,
				}}
				onChange={handleTableChange}
				scroll={{ x: 900 }}
			/>

			<AuditEventDetailModal
				event={selectedEvent}
				onClose={() => setSelectedEvent(null)}
			/>
		</div>
	)
}
