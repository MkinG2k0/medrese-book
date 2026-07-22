import { format } from 'date-fns'

import { formatMessagePreview } from '@/shared/lib/messaging/message-preview'
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
	allUserIds?: string[]
	authorName?: string
	postTitle?: string
	authorUserId?: string
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

type MessagePayload = {
	recipientId?: string
	body?: string
	conversationId?: string
	imageCount?: number
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
			const messagePayload = event.payload as MessagePayload
			const recipientUserId =
				context.recipientUserId ??
				(typeof messagePayload.recipientId === 'string'
					? messagePayload.recipientId
					: undefined)
			if (!recipientUserId) return []

			const senderName = context.senderName ?? 'Собеседник'
			const bodyText =
				typeof messagePayload.body === 'string' ? messagePayload.body : ''
			const imageCount =
				typeof messagePayload.imageCount === 'number'
					? messagePayload.imageCount
					: 0
			const preview = formatMessagePreview({
				body: bodyText,
				mediaCount: imageCount,
				variant: 'notify',
			})
			const conversationId =
				context.conversationId ??
				(typeof messagePayload.conversationId === 'string'
					? messagePayload.conversationId
					: undefined)
			const link = conversationId
				? `/messages?conversation=${conversationId}`
				: '/messages'

			return [
				{
					userId: recipientUserId,
					type: 'MESSAGE_RECEIVED',
					title: 'Новое сообщение',
					body: `${senderName}: ${truncateMessagePreview(preview)}`,
					link,
					payload: event.payload,
				},
			]
		}

		case 'POST_PUBLISHED': {
			const postTitle = context.postTitle ?? 'Новая публикация'
			const authorName = context.authorName ?? 'Менеджер'
			const authorUserId = context.authorUserId

			return (context.allUserIds ?? [])
				.filter((userId) => userId !== authorUserId)
				.map((userId) => ({
					userId,
					type: 'POST_PUBLISHED',
					title: 'Новая новость',
					body: `${authorName}: ${postTitle}`,
					link: '/news',
					payload: event.payload,
				}))
		}

		default:
			return []
	}
}
