import { formatMessagePreview } from '@/shared/lib/messaging/message-preview'

type MessageContact = { id: string; name: string; role: string }

type Participant = MessageContact

export const conversationInclude = {
	participant1: { select: { id: true, name: true, role: true } },
	participant2: { select: { id: true, name: true, role: true } },
	messages: {
		orderBy: { createdAt: 'desc' as const },
		take: 1,
		select: {
			body: true,
			createdAt: true,
			senderId: true,
			_count: { select: { media: true } },
		},
	},
}

type ConversationRow = {
	id: string
	participant1Id: string
	participant2Id: string
	updatedAt: Date
	participant1: Participant
	participant2: Participant
	messages: {
		body: string
		createdAt: Date
		senderId: string
		_count: { media: number }
	}[]
}

function lastMessageDto(
	last: ConversationRow['messages'][0] | undefined,
) {
	if (!last) return null

	const mediaCount = last._count.media
	const body = formatMessagePreview({
		body: last.body,
		mediaCount,
		variant: 'list',
	})

	return {
		body,
		createdAt: last.createdAt.toISOString(),
		senderId: last.senderId,
	}
}

export function toOwnConversationSummary(
	conversation: ConversationRow,
	currentUserId: string,
) {
	const otherUser =
		conversation.participant1Id === currentUserId
			? conversation.participant2
			: conversation.participant1

	return {
		id: conversation.id,
		isOwn: true as const,
		otherUser: otherUser as MessageContact,
		lastMessage: lastMessageDto(conversation.messages[0]),
		updatedAt: conversation.updatedAt.toISOString(),
	}
}

export function toObservedConversationSummary(conversation: ConversationRow) {
	const { participant1, participant2 } = conversation
	const teacher =
		participant1.role === 'TEACHER'
			? participant1
			: participant2.role === 'TEACHER'
				? participant2
				: participant1
	const other = teacher.id === participant1.id ? participant2 : participant1

	return {
		id: conversation.id,
		isOwn: false as const,
		otherUser: teacher as MessageContact,
		title: `${teacher.name} ↔ ${other.name}`,
		participants: [teacher, other] as [MessageContact, MessageContact],
		lastMessage: lastMessageDto(conversation.messages[0]),
		updatedAt: conversation.updatedAt.toISOString(),
	}
}

export function conversationInvolvesTeacher(conversation: {
	participant1: { role: string }
	participant2: { role: string }
}): boolean {
	return (
		conversation.participant1.role === 'TEACHER' ||
		conversation.participant2.role === 'TEACHER'
	)
}
