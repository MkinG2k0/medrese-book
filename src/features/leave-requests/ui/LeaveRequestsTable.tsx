'use client'

import { Button, DatePicker, Select, Table, Tag, Tooltip } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'

import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import {
	getLeaveRequestStatusLabel,
	getLeaveRequestTypeLabel,
	LEAVE_REQUEST_STATUS_LABELS,
	LEAVE_REQUEST_TYPE_LABELS,
} from '@/features/leave-requests/lib/leave-labels'
import type {
	LeaveRequestStatus,
	LeaveRequestType,
} from '@/shared/lib/prisma'
import Text from '@/shared/ui/Text'

const { RangePicker } = DatePicker

const LEAVE_TYPE_TAG_COLORS: Record<
	LeaveRequestType,
	'blue' | 'orange' | 'purple'
> = {
	VACATION: 'blue',
	DAY_OFF: 'orange',
	SICK_LEAVE: 'purple',
}

const LEAVE_STATUS_TAG_COLORS: Record<
	LeaveRequestStatus,
	'default' | 'success' | 'error'
> = {
	CREATED: 'default',
	APPROVED: 'success',
	REJECTED: 'error',
}

const ALL_FILTER = 'ALL'

type LeaveRequestsTableProps = {
	requests: LeaveRequestListItem[]
	loading?: boolean
	teachers: { id: string; name: string }[]
	onRowClick: (request: LeaveRequestListItem) => void
	onApprove: (request: LeaveRequestListItem) => void
	onReject: (request: LeaveRequestListItem) => void
}

function formatPeriod(startDate: string, endDate: string) {
	const start = dayjs(startDate).format('DD.MM.YYYY')
	const end = dayjs(endDate).format('DD.MM.YYYY')
	return start === end ? start : `${start} — ${end}`
}

function truncateDescription(text: string, maxLength = 40) {
	if (text.length <= maxLength) return text
	return `${text.slice(0, maxLength)}…`
}

export function LeaveRequestsTable({
	requests,
	loading = false,
	teachers,
	onRowClick,
	onApprove,
	onReject,
}: LeaveRequestsTableProps) {
	const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER)
	const [teacherFilter, setTeacherFilter] = useState<string>(ALL_FILTER)
	const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER)
	const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

	const filteredRequests = useMemo(() => {
		return requests.filter((request) => {
			if (statusFilter !== ALL_FILTER && request.status !== statusFilter) {
				return false
			}

			if (typeFilter !== ALL_FILTER && request.type !== typeFilter) {
				return false
			}

			if (teacherFilter !== ALL_FILTER && request.teacherId !== teacherFilter) {
				return false
			}

			if (dateRange) {
				const from = dateRange[0].startOf('day')
				const to = dateRange[1].endOf('day')
				const start = dayjs(request.startDate)
				const end = dayjs(request.endDate)
				if (end.isBefore(from) || start.isAfter(to)) {
					return false
				}
			}

			return true
		})
	}, [requests, statusFilter, teacherFilter, typeFilter, dateRange])

	const showRejectionColumn = statusFilter === 'REJECTED'

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-4">
				<Select
					value={statusFilter}
					className="min-w-[160px]"
					onChange={setStatusFilter}
					options={[
						{ value: ALL_FILTER, label: 'Все' },
						...Object.entries(LEAVE_REQUEST_STATUS_LABELS).map(
							([value, label]) => ({
								value,
								label,
							}),
						),
					]}
				/>
				<Select
					value={teacherFilter}
					showSearch
					optionFilterProp="label"
					className="min-w-[200px]"
					onChange={setTeacherFilter}
					options={[
						{ value: ALL_FILTER, label: 'Все' },
						...teachers.map((teacher) => ({
							value: teacher.id,
							label: teacher.name,
						})),
					]}
				/>
				<Select
					value={typeFilter}
					className="min-w-[160px]"
					onChange={setTypeFilter}
					options={[
						{ value: ALL_FILTER, label: 'Все' },
						...Object.entries(LEAVE_REQUEST_TYPE_LABELS).map(
							([value, label]) => ({
								value,
								label,
							}),
						),
					]}
				/>
				<RangePicker
					value={dateRange}
					format="DD.MM.YYYY"
					inputReadOnly
					onChange={(dates) => {
						if (!dates?.[0] || !dates[1]) {
							setDateRange(null)
							return
						}
						setDateRange([dates[0], dates[1]])
					}}
					allowClear
				/>
			</div>

			<Table
				rowKey="id"
				loading={loading}
				dataSource={filteredRequests}
				pagination={{ pageSize: 20 }}
				onRow={(record) => ({
					onClick: () => onRowClick(record),
					className: 'cursor-pointer',
				})}
				locale={{
					emptyText: (
						<div className="py-8 text-center">
							<Text type="secondary">
								Заявки не найдены. Измените фильтры или дождитесь новых заявок
								от преподавателей.
							</Text>
						</div>
					),
				}}
				columns={[
					{
						title: 'Преподаватель',
						dataIndex: 'teacherName',
						key: 'teacherName',
					},
					{
						title: 'Тип',
						dataIndex: 'type',
						key: 'type',
						render: (type: LeaveRequestType) => (
							<Tag color={LEAVE_TYPE_TAG_COLORS[type]}>
								{getLeaveRequestTypeLabel(type)}
							</Tag>
						),
					},
					{
						title: 'Период',
						key: 'period',
						render: (_value, record) =>
							formatPeriod(record.startDate, record.endDate),
					},
					{
						title: 'Статус',
						dataIndex: 'status',
						key: 'status',
						render: (status: LeaveRequestStatus) => (
							<Tag color={LEAVE_STATUS_TAG_COLORS[status]}>
								{getLeaveRequestStatusLabel(status)}
							</Tag>
						),
					},
					{
						title: 'Описание',
						dataIndex: 'description',
						key: 'description',
						ellipsis: true,
						render: (description: string) => (
							<Tooltip title={description}>
								<span>{truncateDescription(description)}</span>
							</Tooltip>
						),
					},
					...(showRejectionColumn
						? [
								{
									title: 'Причина отклонения',
									dataIndex: 'rejectionReason',
									key: 'rejectionReason',
									render: (reason: string | null) => reason ?? '—',
								},
							]
						: []),
					{
						title: 'Замещающий',
						dataIndex: 'substituteName',
						key: 'substituteName',
						render: (name: string | null) => name ?? '—',
					},
					{
						title: 'Действия',
						key: 'actions',
						render: (_value, record) => {
							if (record.status !== 'CREATED') return null
							return (
								<div
									className="flex flex-wrap gap-2"
									onClick={(event) => event.stopPropagation()}
									onKeyDown={(event) => event.stopPropagation()}
								>
									<Button
										type="link"
										size="small"
										className="!px-0"
										onClick={() => onApprove(record)}
									>
										Подтвердить
									</Button>
									<Button
										type="link"
										size="small"
										danger
										className="!px-0"
										onClick={() => onReject(record)}
									>
										Отклонить
									</Button>
								</div>
							)
						},
					},
				]}
			/>
		</div>
	)
}
