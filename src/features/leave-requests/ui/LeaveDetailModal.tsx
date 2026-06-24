'use client'

import { Descriptions, Modal, Tag, Button } from 'antd'
import dayjs from 'dayjs'

import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import {
	getLeaveRequestStatusLabel,
	getLeaveRequestTypeLabel,
} from '@/features/leave-requests/lib/leave-labels'

const LEAVE_TYPE_TAG_COLORS: Record<
	LeaveRequestListItem['type'],
	'blue' | 'orange' | 'purple'
> = {
	VACATION: 'blue',
	DAY_OFF: 'orange',
	SICK_LEAVE: 'purple',
}

const LEAVE_STATUS_TAG_COLORS: Record<
	LeaveRequestListItem['status'],
	'default' | 'success' | 'error'
> = {
	CREATED: 'default',
	APPROVED: 'success',
	REJECTED: 'error',
}

function formatPeriod(startDate: string, endDate: string) {
	const start = dayjs(startDate).format('DD.MM.YYYY')
	const end = dayjs(endDate).format('DD.MM.YYYY')
	return start === end ? start : `${start} — ${end}`
}

type LeaveDetailModalProps = {
	request: LeaveRequestListItem | null
	variant?: 'teacher' | 'manager'
	onClose: () => void
	onApprove?: (request: LeaveRequestListItem) => void
	onReject?: (request: LeaveRequestListItem) => void
}

export function LeaveDetailModal({
	request,
	variant = 'teacher',
	onClose,
	onApprove,
	onReject,
}: LeaveDetailModalProps) {
	const title = request ? 'Заявка на отсутствие' : ''
	const showManagerActions =
		variant === 'manager' &&
		request?.status === 'CREATED' &&
		onApprove != null &&
		onReject != null

	return (
		<Modal
			title={title}
			open={request != null}
			onCancel={onClose}
			destroyOnHidden
			width={480}
			footer={
				showManagerActions && request
					? [
							<Button key="reject" danger onClick={() => onReject(request)}>
								Отклонить
							</Button>,
							<Button
								key="approve"
								type="primary"
								onClick={() => onApprove(request)}
							>
								Подтвердить
							</Button>,
						]
					: null
			}
		>
			{request && (
				<Descriptions column={1} size="small" className="pt-2">
					{variant === 'manager' && (
						<Descriptions.Item label="Преподаватель">
							{request.teacherName}
						</Descriptions.Item>
					)}
					<Descriptions.Item label="Статус">
						<Tag color={LEAVE_STATUS_TAG_COLORS[request.status]}>
							{getLeaveRequestStatusLabel(request.status)}
						</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Тип">
						<Tag color={LEAVE_TYPE_TAG_COLORS[request.type]}>
							{getLeaveRequestTypeLabel(request.type)}
						</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Период">
						{formatPeriod(request.startDate, request.endDate)}
					</Descriptions.Item>
					<Descriptions.Item label="Описание">
						{request.description}
					</Descriptions.Item>
					{request.substituteName && (
						<Descriptions.Item label="Замещающий">
							{request.substituteName}
						</Descriptions.Item>
					)}
					{request.status === 'REJECTED' && request.rejectionReason && (
						<Descriptions.Item label="Причина отклонения">
							{request.rejectionReason}
						</Descriptions.Item>
					)}
				</Descriptions>
			)}
		</Modal>
	)
}
