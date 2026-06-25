import { created, forbidden, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import {
	canMessageUser,
	sortParticipantIds,
} from '@/shared/lib/messaging/can-message-user'
import {
	conversationInclude,
	toObservedConversationSummary,
	toOwnConversationSummary,
} from '@/shared/lib/messaging/conversation-dto'
import { prisma } from '@/shared/lib/prisma'
import { createConversationSchema } from '@/shared/lib/validations/message'

const conversationListInclude = conversationInclude

export async function GET() {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	try {
		const ownConversations = await prisma.conversation.findMany({
			where: {
				OR: [
					{ participant1Id: session.user.id },
					{ participant2Id: session.user.id },
				],
			},
			include: conversationListInclude,
			orderBy: { updatedAt: 'desc' },
		})

		const mine = ownConversations.map((c) =>
			toOwnConversationSummary(c, session.user.id),
		)

		if (session.user.role !== 'MANAGER') {
			return success({ mine })
		}

		const teacherChats = await prisma.conversation.findMany({
			where: {
				AND: [
					{
						NOT: {
							OR: [
								{ participant1Id: session.user.id },
								{ participant2Id: session.user.id },
							],
						},
					},
					{
						OR: [
							{ participant1: { role: 'TEACHER' } },
							{ participant2: { role: 'TEACHER' } },
						],
					},
				],
			},
			include: conversationListInclude,
			orderBy: { updatedAt: 'desc' },
		})

		return success({
			mine,
			teacherChats: teacherChats.map(toObservedConversationSummary),
		})
	} catch (err) {
		return serverError(err)
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
		return serverError(new Error('Некорректный JSON'))
	}

	const parsed = createConversationSchema.safeParse(body)
	if (!parsed.success) return serverError(new Error(parsed.error.message))

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
			include: conversationListInclude,
		})

		if (existing) {
			return success(toOwnConversationSummary(existing, session.user.id))
		}

		const conversation = await prisma.conversation.create({
			data: { participant1Id, participant2Id },
			include: conversationListInclude,
		})

		return created(toOwnConversationSummary(conversation, session.user.id))
	} catch (err) {
		return serverError(err)
	}
}
