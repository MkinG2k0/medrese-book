'use client'

import { MessageOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, List, Select, Spin } from 'antd'
import { useMemo, useState } from 'react'

import type { ConversationSummary, MessageContact } from '@/entities/conversation'
import { useMessageContacts } from '@/entities/conversation'
import { contactSubtitle } from '@/features/messaging/lib/contact-labels'
import Text from '@/shared/ui/Text'

type ConversationListProps = {
	conversations: ConversationSummary[]
	selectedId: string | null
	loading: boolean
	onSelect: (conversationId: string) => void
	onStartChat: (contact: MessageContact) => Promise<void>
}

export function ConversationList({
	conversations,
	selectedId,
	loading,
	onSelect,
	onStartChat,
}: ConversationListProps) {
	const { data: contacts = [], isLoading: contactsLoading } =
		useMessageContacts()
	const [newContactId, setNewContactId] = useState<string | null>(null)
	const [starting, setStarting] = useState(false)

	const existingContactIds = useMemo(
		() => new Set(conversations.map((c) => c.otherUser.id)),
		[conversations],
	)

	const availableContacts = useMemo(
		() => contacts.filter((c) => !existingContactIds.has(c.id)),
		[contacts, existingContactIds],
	)

	const handleStart = async () => {
		if (!newContactId) return
		const contact = contacts.find((c) => c.id === newContactId)
		if (!contact) return
		setStarting(true)
		try {
			await onStartChat(contact)
			setNewContactId(null)
		} finally {
			setStarting(false)
		}
	}

	return (
		<div className="flex h-full flex-col border-r border-[#2a2622]">
			<div className="border-b border-[#2a2622] p-4">
				<Text strong className="mb-3 block">
					Сообщения
				</Text>
				<div className="flex gap-2">
					<Select
						className="min-w-0 flex-1"
						placeholder="Новый диалог"
						loading={contactsLoading}
						value={newContactId}
						onChange={setNewContactId}
						options={availableContacts.map((c) => ({
							value: c.id,
							label: `${c.name} (${contactSubtitle(c)})`,
						}))}
						showSearch
						optionFilterProp="label"
						allowClear
					/>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						disabled={!newContactId}
						loading={starting}
						onClick={() => void handleStart()}
					/>
				</div>
			</div>

			{loading ? (
				<div className="flex flex-1 items-center justify-center">
					<Spin />
				</div>
			) : conversations.length === 0 ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
					<MessageOutlined className="text-2xl text-[#8a8375]" />
					<Text type="secondary">Нет диалогов. Начните новый чат.</Text>
				</div>
			) : (
				<List
					className="flex-1 overflow-y-auto"
					dataSource={conversations}
					renderItem={(item) => (
						<List.Item
							className={`cursor-pointer px-4 !border-[#2a2622] hover:bg-[#1e1b18] ${
								selectedId === item.id ? 'bg-[#1e1b18]' : ''
							}`}
							onClick={() => onSelect(item.id)}
						>
							<List.Item.Meta
								title={item.otherUser.name}
								description={
									<div className="flex flex-col gap-0.5">
										<Text type="secondary" className="text-xs">
											{contactSubtitle(item.otherUser)}
										</Text>
										{item.lastMessage && (
											<Text type="secondary" className="truncate text-xs">
												{item.lastMessage.body}
											</Text>
										)}
									</div>
								}
							/>
						</List.Item>
					)}
				/>
			)}
		</div>
	)
}
