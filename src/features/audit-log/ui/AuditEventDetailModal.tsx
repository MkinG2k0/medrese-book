'use client'

import { Descriptions, Modal } from 'antd'

import type { AuditEventListItem } from '@/entities/audit-event/model/types'
import {
	getAuditActionLabel,
	getAuditEntityTypeLabel,
} from '@/features/audit-log/lib/audit-labels'

type AuditEventDetailModalProps = {
	event: AuditEventListItem | null
	onClose: () => void
}

function formatPayloadValue(value: unknown): string {
	if (value == null) return '—'
	if (typeof value === 'object') return JSON.stringify(value, null, 2)
	return String(value)
}

export function AuditEventDetailModal({
	event,
	onClose,
}: AuditEventDetailModalProps) {
	return (
		<Modal
			title="Детали события"
			open={event != null}
			onCancel={onClose}
			footer={null}
			width={640}
		>
			{event && (
				<Descriptions column={1} size="small" bordered>
					<Descriptions.Item label="Дата">
						{new Date(event.createdAt).toLocaleString('ru-RU')}
					</Descriptions.Item>
					<Descriptions.Item label="Автор">{event.actorName}</Descriptions.Item>
					<Descriptions.Item label="Событие">
						{getAuditActionLabel(event.action)}
					</Descriptions.Item>
					<Descriptions.Item label="Тип сущности">
						{getAuditEntityTypeLabel(event.entityType)}
					</Descriptions.Item>
					{event.entityType === 'User' ? (
						<Descriptions.Item label="Пользователь">
							{event.actorName}
						</Descriptions.Item>
					) : (
						<Descriptions.Item label="ID сущности">
							{event.entityId}
						</Descriptions.Item>
					)}
					<Descriptions.Item label="Данные">
						<pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
							{formatPayloadValue(event.payload)}
						</pre>
					</Descriptions.Item>
				</Descriptions>
			)}
		</Modal>
	)
}
