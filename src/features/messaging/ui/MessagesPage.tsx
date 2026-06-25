'use client'

import { useMemo, useState } from 'react'

import type { ConversationSummary, MessageContact } from '@/entities/conversation'
import { useConversations } from '@/entities/conversation'
import { ChatPanel } from '@/features/messaging/ui/ChatPanel'
import { ConversationList } from '@/features/messaging/ui/ConversationList'

export function MessagesPage() {
	const { data: conversations = [], isLoading, refetch } = useConversations()
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const selectedConversation = useMemo(
		() => conversations.find((c) => c.id === selectedId) ?? null,
		[conversations, selectedId],
	)

	const handleStartChat = async (contact: MessageContact) => {
		const res = await fetch('/api/conversations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipientId: contact.id }),
		})
		const json = await res.json()
		if (json.error) throw new Error(json.error)
		const conversation = json.data as ConversationSummary
		await refetch()
		setSelectedId(conversation.id)
	}

	return (
		<div className="flex h-[calc(100vh-10rem)] min-h-[480px] overflow-hidden rounded-lg border border-[#2a2622] bg-[#161412]">
			<div className="w-full max-w-xs shrink-0 md:max-w-sm">
				<ConversationList
					conversations={conversations}
					selectedId={selectedId}
					loading={isLoading}
					onSelect={setSelectedId}
					onStartChat={handleStartChat}
				/>
			</div>
			<ChatPanel conversation={selectedConversation} />
		</div>
	)
}
