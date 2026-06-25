'use client'

import { Button, Select, Table, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
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
import Title from '@/shared/ui/Title'

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

type TeacherLeaveRequestsTableProps = {
	requests: LeaveRequestListItem[]
	loading?: boolean
	onRowClick: (request: LeaveRequestListItem) => void
	onEdit: (request: LeaveRequestListItem) => void
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

function canEditRequest(request: LeaveRequestListItem) {
	return request.status === 'CREATED' || request.status === 'REJECTED'
}

export function TeacherLeaveRequestsTable({
	requests,
	loading = false,
	onRowClick,
	onEdit,
}: TeacherLeaveRequestsTableProps) {
	const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER)
	const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER)

	const filteredRequests = useMemo(() => {
		return requests.filter((request) => {
			if (statusFilter !== ALL_FILTER && request.status !== statusFilter) {
				return false
			}
			if (typeFilter !== ALL_FILTER && request.type !== typeFilter) {
				return false
			}
			return true
		})
	}, [requests, statusFilter, typeFilter])

	const showRejectionColumn =
		statusFilter === 'REJECTED' || statusFilter === ALL_FILTER

	return (
		<div className="flex flex-col gap-4">
			<Title level={4} className="!mb-0">
				Мои заявки
			</Title>

			<div className="flex flex-wrap gap-4">
				<Select
					value={statusFilter}
					className="min-w-[160px]"
					onChange={setStatusFilter}
					options={[
						{ value: ALL_FILTER, label: 'Все статусы' },
						...Object.entries(LEAVE_REQUEST_STATUS_LABELS).map(
							([value, label]) => ({
								value,
								label,
							}),
						),
					]}
				/>
				<Select
					value={typeFilter}
					className="min-w-[160px]"
					onChange={setTypeFilter}
					options={[
						{ value: ALL_FILTER, label: 'Все типы' },
						...Object.entries(LEAVE_REQUEST_TYPE_LABELS).map(
							([value, label]) => ({
								value,
								label,
							}),
						),
					]}
				/>
			</div>

			<Table
				rowKey="id"
				loading={loading}
				dataSource={filteredRequests}
				pagination={{ pageSize: 10 }}
				onRow={(record) => ({
					onClick: () => onRowClick(record),
					className: 'cursor-pointer',
				})}
				locale={{
					emptyText: (
						<div className="py-8 text-center">
							<Text type="secondary">
								Заявок пока нет. Создайте отпуск, отгул или больничный с помощью
								кнопок выше.
							</Text>
						</div>
					),
				}}
				columns={[
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
							if (!canEditRequest(record)) return null
							return (
								<div
									onClick={(event) => event.stopPropagation()}
									onKeyDown={(event) => event.stopPropagation()}
								>
									<Button
										type="link"
										size="small"
										className="!px-0"
										onClick={() => onEdit(record)}
									>
										Изменить
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
