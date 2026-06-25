export type MessageContact = {
	id: string
	name: string
	role: string
}

export type ConversationSummary = {
	id: string
	otherUser: MessageContact
	lastMessage: {
		body: string
		createdAt: string
		senderId: string
	} | null
	updatedAt: string
}

export type ChatMessage = {
	id: string
	body: string
	senderId: string
	createdAt: string
}
