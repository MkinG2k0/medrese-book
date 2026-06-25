import { created, error, forbidden, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import {
	canMessageUser,
	sortParticipantIds,
} from '@/shared/lib/messaging/can-message-user'
import { prisma } from '@/shared/lib/prisma'
import { createConversationSchema } from '@/shared/lib/validations/message'

function toConversationSummary(
	conversation: {
		id: string
		participant1Id: string
		participant2Id: string
		updatedAt: Date
		participant1: { id: string; name: string; role: string }
		participant2: { id: string; name: string; role: string }
		messages: { body: string; createdAt: Date; senderId: string }[]
	},
	currentUserId: string,
) {
	const otherUser =
		conversation.participant1Id === currentUserId
			? conversation.participant2
			: conversation.participant1
	const last = conversation.messages[0] ?? null

	return {
		id: conversation.id,
		otherUser: {
			id: otherUser.id,
			name: otherUser.name,
			role: otherUser.role,
		},
		lastMessage: last
			? {
					body: last.body,
					createdAt: last.createdAt.toISOString(),
					senderId: last.senderId,
				}
			: null,
		updatedAt: conversation.updatedAt.toISOString(),
	}
}

export async function GET() {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	try {
		const conversations = await prisma.conversation.findMany({
			where: {
				OR: [
					{ participant1Id: session.user.id },
					{ participant2Id: session.user.id },
				],
			},
			include: {
				participant1: { select: { id: true, name: true, role: true } },
				participant2: { select: { id: true, name: true, role: true } },
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: { body: true, createdAt: true, senderId: true },
				},
			},
			orderBy: { updatedAt: 'desc' },
		})

		return success(
			conversations.map((c) => toConversationSummary(c, session.user.id)),
		)
	} catch (err) {
		return error('Не удалось загрузить диалоги', 500)
	}
}

export async function POST(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return error('Некорректный JSON')
	}

	const parsed = createConversationSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	const { recipientId } = parsed.data

	if (!(await canMessageUser(session, recipientId))) {
		return forbidden()
	}

	const [participant1Id, participant2Id] = sortParticipantIds(
		session.user.id,
		recipientId,
	)

	try {
		const existing = await prisma.conversation.findUnique({
			where: {
				participant1Id_participant2Id: { participant1Id, participant2Id },
			},
			include: {
				participant1: { select: { id: true, name: true, role: true } },
				participant2: { select: { id: true, name: true, role: true } },
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: { body: true, createdAt: true, senderId: true },
				},
			},
		})

		if (existing) {
			return success(toConversationSummary(existing, session.user.id))
		}

		const conversation = await prisma.conversation.create({
			data: { participant1Id, participant2Id },
			include: {
				participant1: { select: { id: true, name: true, role: true } },
				participant2: { select: { id: true, name: true, role: true } },
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: { body: true, createdAt: true, senderId: true },
				},
			},
		})

		return created(toConversationSummary(conversation, session.user.id))
	} catch (err) {
		return error('Не удалось создать диалог', 500)
	}
}
