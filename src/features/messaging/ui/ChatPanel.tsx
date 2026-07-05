'use client'

import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Input, Spin } from 'antd'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

import type { ConversationSummary } from '@/entities/conversation'
import { useMessages, useSendMessage } from '@/entities/conversation'
import { ContactRoleBadge } from '@/features/messaging/ui/ContactRoleBadge'
import Text from '@/shared/ui/Text'

type ChatPanelProps = {
	conversation: ConversationSummary | null
	onBack?: () => void
}

export function ChatPanel({ conversation, onBack }: ChatPanelProps) {
	const { data: session } = useSession()
	const currentUserId = session?.user?.id
	const readOnly = conversation ? !conversation.isOwn : false
	const { data: messages = [], isLoading } = useMessages(conversation?.id ?? null)
	const sendMessage = useSendMessage(conversation?.id ?? null)
	const [draft, setDraft] = useState('')
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const handleSend = async () => {
		const text = draft.trim()
		if (!text || !conversation || readOnly) return
		setDraft('')
		try {
			await sendMessage.mutateAsync(text)
		} catch {
			setDraft(text)
		}
	}

	if (!conversation) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center p-6">
				<Text type="secondary">Выберите диалог или начните новый чат</Text>
			</div>
		)
	}

	const headerTitle = conversation.title ?? conversation.otherUser.name

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex shrink-0 items-start gap-2 border-b border-[#2a2622] px-4 py-3 md:px-6 md:py-4">
				{onBack && (
					<Button
						type="text"
						icon={<ArrowLeftOutlined />}
						aria-label="Назад к списку"
						onClick={onBack}
						className="shrink-0"
					/>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<Text strong className="truncate">
							{headerTitle}
						</Text>
						{conversation.isOwn && (
							<ContactRoleBadge role={conversation.otherUser.role} />
						)}
					</div>
					{!conversation.isOwn && (
						<Text type="secondary" className="text-sm">
							Просмотр диалога
						</Text>
					)}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spin />
					</div>
				) : messages.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<Text type="secondary">
							{readOnly ? 'Сообщений пока нет' : 'Нет сообщений. Напишите первым.'}
						</Text>
					</div>
				) : (
					<div className="flex min-h-full flex-col justify-end gap-3">
						{messages.map((msg) => {
							const isOwn = msg.senderId === currentUserId
							return (
								<div
									key={msg.id}
									className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[75%] rounded-lg px-3 py-2 ${
											isOwn ? 'bg-[#3d3428]' : 'bg-[#1e1b18]'
										}`}
									>
										<Text className="whitespace-pre-wrap break-words">
											{msg.body}
										</Text>
										<Text type="secondary" className="mt-1 block text-xs">
											{new Date(msg.createdAt).toLocaleString('ru-RU', {
												day: '2-digit',
												month: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</Text>
									</div>
								</div>
							)
						})}
						<div ref={bottomRef} />
					</div>
				)}
			</div>

			{!readOnly && (
				<div className="shrink-0 border-t border-[#2a2622] p-4">
					<div className="flex gap-2">
						<Input.TextArea
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder="Введите сообщение…"
							autoSize={{ minRows: 1, maxRows: 4 }}
							onPressEnter={(e) => {
								if (!e.shiftKey) {
									e.preventDefault()
									void handleSend()
								}
							}}
							disabled={sendMessage.isPending}
						/>
						<Button
							type="primary"
							icon={<SendOutlined />}
							onClick={() => void handleSend()}
							loading={sendMessage.isPending}
							disabled={!draft.trim()}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
