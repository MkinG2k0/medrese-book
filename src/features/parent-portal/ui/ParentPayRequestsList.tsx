'use client'

import { Tag } from 'antd'

import type { ParentPaymentRequestSummary } from '@/features/parent-portal/actions/parent-payment-actions'
import { formatMoney } from '@/shared/lib/money'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

interface ParentPayRequestsListProps {
	requests: ParentPaymentRequestSummary[]
	className?: string
}

const REQUEST_STATUS_LABELS: Record<
	ParentPaymentRequestSummary['status'],
	{ label: string; color: string }
> = {
	PENDING: { label: 'Ожидает подтверждения', color: 'processing' },
	CONFIRMED: { label: 'Подтверждена', color: 'success' },
	REJECTED: { label: 'Отклонена', color: 'error' },
}

export function ParentPayRequestsList({
	requests,
	className,
}: ParentPayRequestsListProps) {
	if (requests.length === 0) return null

	return (
		<div className={className ?? 'flex flex-col gap-3'}>
			<Title level={4} className="!mb-0">
				Мои заявки
			</Title>
			{requests.map((request) => {
				const status = REQUEST_STATUS_LABELS[request.status]
				return (
					<div
						key={request.id}
						className="flex flex-col gap-2 rounded-lg border border-white/10 p-4"
					>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Text strong>{formatMoney(request.totalKopecks)}</Text>
							<Tag color={status.color}>{status.label}</Tag>
						</div>
						<Text type="secondary">
							{new Date(request.createdAt).toLocaleString('ru-RU')}
							{' · '}
							{request.lines
								.map(
									(line) =>
										`${line.studentName}: ${formatMoney(line.amountKopecks)}`,
								)
								.join('; ')}
						</Text>
						{request.rejectReason ? (
							<Text type="danger">Причина: {request.rejectReason}</Text>
						) : null}
					</div>
				)
			})}
		</div>
	)
}
