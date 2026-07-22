export type MessageContact = {
	id: string
	name: string
	role: string
}

export type ConversationSummary = {
	id: string
	isOwn: boolean
	otherUser: MessageContact
	title?: string
	participants?: [MessageContact, MessageContact]
	lastMessage: {
		body: string
		createdAt: string
		senderId: string
	} | null
	updatedAt: string
}

export type ConversationsPayload = {
	mine: ConversationSummary[]
	teacherChats?: ConversationSummary[]
}

export type ChatMessage = {
	id: string
	body: string
	senderId: string
	createdAt: string
	media: {
		id: string
		url: string
		sortOrder: number
	}[]
}
