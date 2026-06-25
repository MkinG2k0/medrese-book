import type { Notification, Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'

import type { DomainEvent } from '../domain-events/types'

import {
	buildNotificationsForEvent,
	type NotificationBuildContext,
} from './build-notification'

type LeavePayload = {
	teacherUserId?: string
	teacherId?: string
	substituteTeacherId?: string | null
}

async function resolveBuildContext(
	event: DomainEvent,
	client: Prisma.TransactionClient | typeof prisma,
): Promise<NotificationBuildContext> {
	const payload = event.payload as LeavePayload
	const context: NotificationBuildContext = {
		managerUserIds: [],
	}

	if (event.action === 'LEAVE_REQUEST_CREATED') {
		const [managers, teacher] = await Promise.all([
			client.user.findMany({
				where: { role: { in: ['MANAGER', 'SUPER_ADMIN'] } },
				select: { id: true },
			}),
			payload.teacherUserId
				? client.user.findUnique({
						where: { id: payload.teacherUserId },
						select: { name: true },
					})
				: payload.teacherId
					? client.teacher.findUnique({
							where: { id: payload.teacherId },
							select: { user: { select: { name: true } } },
						})
					: null,
		])

		context.managerUserIds = managers.map((user) => user.id)
		context.teacherName =
			teacher && 'name' in teacher
				? teacher.name
				: teacher?.user?.name
	}

	if (
		event.action === 'LEAVE_REQUEST_APPROVED' ||
		event.action === 'LEAVE_REQUEST_REJECTED'
	) {
		context.teacherUserId = payload.teacherUserId
	}

	if (event.action === 'SUBSTITUTION_ACTIVATED' && payload.substituteTeacherId) {
		const [substitute, absent] = await Promise.all([
			client.teacher.findUnique({
				where: { id: payload.substituteTeacherId },
				select: { userId: true },
			}),
			payload.teacherId
				? client.teacher.findUnique({
						where: { id: payload.teacherId },
						select: { user: { select: { name: true } } },
					})
				: null,
		])

		context.substituteUserId = substitute?.userId
		context.absentTeacherName = absent?.user.name
	}

	return context
}

export async function enqueueNotifications(
	event: DomainEvent,
	tx?: Prisma.TransactionClient,
): Promise<Notification[]> {
	const client = tx ?? prisma
	const context = await resolveBuildContext(event, client)
	const drafts = await buildNotificationsForEvent(event, context)

	if (drafts.length === 0) {
		return []
	}

	return client.notification.createManyAndReturn({
		data: drafts.map((draft) => ({
			userId: draft.userId,
			type: draft.type,
			title: draft.title,
			body: draft.body,
			link: draft.link ?? null,
			payload: draft.payload ?? undefined,
		})),
	})
}
