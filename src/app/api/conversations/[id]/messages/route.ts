import { created, forbidden, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import {
	canViewConversation,
	userInConversation,
} from '@/shared/lib/messaging/can-message-user'
import { deliverNotifications } from '@/shared/lib/notifications/deliver-notifications'
import { prisma } from '@/shared/lib/prisma'
import { sendMessageSchema } from '@/shared/lib/validations/message'

type RouteContext = { params: Promise<{ id: string }> }

function toMessageDto(message: {
	id: string
	body: string
	senderId: string
	createdAt: Date
}) {
	return {
		id: message.id,
		body: message.body,
		senderId: message.senderId,
		createdAt: message.createdAt.toISOString(),
	}
}

export async function GET(_request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const { id } = await context.params

	try {
		if (!(await canViewConversation(session, id))) {
			return forbidden()
		}

		const messages = await prisma.message.findMany({
			where: { conversationId: id },
			orderBy: { createdAt: 'asc' },
			select: { id: true, body: true, senderId: true, createdAt: true },
		})

		return success(messages.map(toMessageDto))
	} catch (err) {
		return serverError(err)
	}
}

export async function POST(request: Request, context: RouteContext) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const { id } = await context.params

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return serverError(new Error('Некорректный JSON'))
	}

	const parsed = sendMessageSchema.safeParse(body)
	if (!parsed.success) return serverError(new Error(parsed.error.message))

	try {
		const conversation = await prisma.conversation.findUnique({
			where: { id },
		})
		if (
			!conversation ||
			!(await userInConversation(conversation, session.user.id))
		) {
			return forbidden()
		}

		const recipientId =
			conversation.participant1Id === session.user.id
				? conversation.participant2Id
				: conversation.participant1Id

		const result = await prisma.$transaction(async (tx) => {
			const createdMessage = await tx.message.create({
				data: {
					conversationId: id,
					senderId: session.user.id,
					body: parsed.data.body,
				},
				select: { id: true, body: true, senderId: true, createdAt: true },
			})
			await tx.conversation.update({
				where: { id },
				data: { updatedAt: new Date() },
			})

			const notifications = await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'MESSAGE_RECEIVED',
					entityType: 'Message',
					entityId: createdMessage.id,
					payload: {
						conversationId: id,
						messageId: createdMessage.id,
						senderId: session.user.id,
						recipientId,
						body: parsed.data.body,
					},
				},
				tx,
			)

			return { createdMessage, notifications }
		})

		void deliverNotifications(result.notifications)

		return created(toMessageDto(result.createdMessage))
	} catch (err) {
		return serverError(err)
	}
}
