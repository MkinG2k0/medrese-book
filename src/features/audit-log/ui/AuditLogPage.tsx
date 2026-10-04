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
} from '@/features/audit-log/lib/audit-labels'
import { formatAuditEntitySummary } from '@/features/audit-log/lib/format-audit-entity'
import { AuditEventDetailModal } from '@/features/audit-log/ui/AuditEventDetailModal'
import {
	FilterGrid,
	PageRoot,
	PageTitleRow,
	TABLE_SCROLL_X,
	TableFrame,
} from '@/shared/ui/responsive-page'
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

function renderEventCell(record: AuditEventListItem) {
	return <Tag>{getAuditActionLabel(record.action)}</Tag>
}

function renderEntityCell(record: AuditEventListItem) {
	return formatAuditEntitySummary(record)
}

export function AuditLogPage() {
	const [filters, setFilters] = useState<FilterState>({})
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

	const updateFilters = (patch: Partial<FilterState>) => {
		setPage(1)
		setFilters((prev) => {
			const next = { ...prev, ...patch }
			for (const key of Object.keys(patch) as (keyof FilterState)[]) {
				if (patch[key] === undefined) delete next[key]
			}
			return next
		})
	}

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
				render: (_, record) => renderEventCell(record),
			},
			{
				title: 'Сущность',
				key: 'entity',
				render: (_, record) => renderEntityCell(record),
			},
		],
		[],
	)

	const resetFilters = () => {
		setDateRange(null)
		setPage(1)
		setFilters({})
	}

	const handleDateRangeChange = (
		values: [Dayjs | null, Dayjs | null] | null,
	) => {
		setDateRange(values)
		updateFilters({
			from: values?.[0]?.format('YYYY-MM-DD'),
			to: values?.[1]?.format('YYYY-MM-DD'),
		})
	}

	const handleTableChange = (pagination: TablePaginationConfig) => {
		setPage(pagination.current ?? 1)
		setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE)
	}

	return (
		<PageRoot>
			<PageTitleRow>
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
			</PageTitleRow>

			<FilterGrid className="xl:grid-cols-5">
				<Select
					allowClear
					showSearch
					placeholder="Тип события"
					aria-label="Тип события"
					optionFilterProp="label"
					options={filterOptions.actions}
					value={filters.action}
					onChange={(value) => updateFilters({ action: value ?? undefined })}
					className="w-full min-w-0"
				/>
				<Select
					allowClear
					showSearch
					placeholder="Тип сущности"
					aria-label="Тип сущности"
					optionFilterProp="label"
					options={filterOptions.entityTypes}
					value={filters.entityType}
					onChange={(value) =>
						updateFilters({ entityType: value ?? undefined })
					}
					className="w-full min-w-0"
				/>
				<Select
					allowClear
					showSearch
					placeholder="Автор"
					aria-label="Автор"
					optionFilterProp="label"
					options={filterOptions.actors}
					value={filters.actorId}
					onChange={(value) => updateFilters({ actorId: value ?? undefined })}
					className="w-full min-w-0"
				/>
				<RangePicker
					value={dateRange}
					onChange={handleDateRangeChange}
					format="DD.MM.YYYY"
					inputReadOnly
					placeholder={['С', 'По']}
					className="w-full min-w-0"
				/>
				<Button onClick={resetFilters} className="w-full md:w-auto">
					Сбросить
				</Button>
			</FilterGrid>

			<TableFrame>
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
				onRow={(record) => ({
					onClick: () => setSelectedEvent(record),
					className: 'cursor-pointer',
				})}
				scroll={{ x: TABLE_SCROLL_X }}
			/>
			</TableFrame>

			<AuditEventDetailModal
				event={selectedEvent}
				onClose={() => setSelectedEvent(null)}
			/>
		</PageRoot>
	)
}
