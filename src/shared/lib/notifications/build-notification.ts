import { format } from 'date-fns'

import type { NotificationType } from '@/shared/lib/prisma'

import type { DomainEvent, DomainEventAction } from '../domain-events/types'

const LEAVE_TYPE_LABELS: Record<string, string> = {
	VACATION: 'Отпуск',
	DAY_OFF: 'Отгул',
	SICK_LEAVE: 'Больничный',
}

export type NotificationDraft = {
	userId: string
	type: NotificationType
	title: string
	body: string
	link?: string | null
	payload?: Record<string, unknown>
}

export type NotificationBuildContext = {
	managerUserIds: string[]
	teacherUserId?: string
	teacherName?: string
	substituteUserId?: string
	absentTeacherName?: string
	recipientUserId?: string
	senderName?: string
	conversationId?: string
}

const MESSAGE_PREVIEW_MAX = 120

function truncateMessagePreview(body: string): string {
	const trimmed = body.trim()
	if (trimmed.length <= MESSAGE_PREVIEW_MAX) return trimmed
	return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX - 1)}…`
}

type LeavePayload = {
	teacherUserId?: string
	teacherId?: string
	type?: string
	startDate?: string
	endDate?: string
	substituteTeacherId?: string | null
	rejectionReason?: string
	leaveRequestId?: string
}

export function formatLeaveDateRange(startDate: string, endDate: string): string {
	const start = format(new Date(startDate), 'dd.MM.yyyy')
	const end = format(new Date(endDate), 'dd.MM.yyyy')
	return `${start} — ${end}`
}

export function formatLeaveDateFromTo(startDate: string, endDate: string): string {
	const start = format(new Date(startDate), 'dd.MM.yyyy')
	const end = format(new Date(endDate), 'dd.MM.yyyy')
	return `с ${start} по ${end}`
}

export function getLeaveTypeLabel(type: string): string {
	return LEAVE_TYPE_LABELS[type] ?? type
}

export async function buildNotificationsForEvent(
	event: DomainEvent,
	context: NotificationBuildContext,
): Promise<NotificationDraft[]> {
	const payload = event.payload as LeavePayload

	switch (event.action as DomainEventAction) {
		case 'LEAVE_REQUEST_CREATED': {
			const teacherName = context.teacherName ?? 'Преподаватель'
			const typeLabel = getLeaveTypeLabel(payload.type ?? '')
			const dates =
				payload.startDate && payload.endDate
					? formatLeaveDateRange(payload.startDate, payload.endDate)
					: ''

			return context.managerUserIds.map((userId) => ({
				userId,
				type: 'LEAVE_REQUEST_CREATED',
				title: 'Новая заявка на отсутствие',
				body: `${teacherName}, ${typeLabel}, ${dates}`,
				link: '/admin/leave-calendar',
				payload: event.payload,
			}))
		}

		case 'LEAVE_REQUEST_APPROVED': {
			const teacherUserId = context.teacherUserId ?? payload.teacherUserId
			if (!teacherUserId) return []

			const dates =
				payload.startDate && payload.endDate
					? formatLeaveDateRange(payload.startDate, payload.endDate)
					: ''
			const typeLabel = getLeaveTypeLabel(payload.type ?? '')

			return [
				{
					userId: teacherUserId,
					type: 'LEAVE_REQUEST_APPROVED',
					title: 'Заявка подтверждена',
					body: dates ? `${typeLabel}, ${dates}` : typeLabel,
					link: '/calendar',
					payload: event.payload,
				},
			]
		}

		case 'LEAVE_REQUEST_REJECTED': {
			const teacherUserId = context.teacherUserId ?? payload.teacherUserId
			if (!teacherUserId) return []

			const reason = payload.rejectionReason?.trim()
			const body = reason
				? `Причина: ${reason}`
				: 'Заявка отклонена менеджером'

			return [
				{
					userId: teacherUserId,
					type: 'LEAVE_REQUEST_REJECTED',
					title: 'Заявка отклонена',
					body,
					link: '/calendar',
					payload: event.payload,
				},
			]
		}

		case 'SUBSTITUTION_ACTIVATED': {
			const substituteUserId = context.substituteUserId
			if (!substituteUserId) return []

			const absentName = context.absentTeacherName ?? 'преподавателя'
			const datePart =
				payload.startDate && payload.endDate
					? formatLeaveDateFromTo(payload.startDate, payload.endDate)
					: ''

			return [
				{
					userId: substituteUserId,
					type: 'SUBSTITUTION_ACTIVATED',
					title: 'Назначено замещение',
					body: `Вы замещаете ${absentName} ${datePart}`.trim(),
					link: '/journal',
					payload: event.payload,
				},
			]
		}

		case 'MESSAGE_RECEIVED': {
			const recipientUserId =
				context.recipientUserId ??
				(typeof payload.recipientId === 'string' ? payload.recipientId : undefined)
			if (!recipientUserId) return []

			const senderName = context.senderName ?? 'Собеседник'
			const bodyText =
				typeof payload.body === 'string' ? payload.body : ''
			const conversationId =
				context.conversationId ??
				(typeof payload.conversationId === 'string'
					? payload.conversationId
					: undefined)
			const link = conversationId
				? `/messages?conversation=${conversationId}`
				: '/messages'

			return [
				{
					userId: recipientUserId,
					type: 'MESSAGE_RECEIVED',
					title: 'Новое сообщение',
					body: `${senderName}: ${truncateMessagePreview(bodyText)}`,
					link,
					payload: event.payload,
				},
			]
		}

		default:
			return []
	}
}
