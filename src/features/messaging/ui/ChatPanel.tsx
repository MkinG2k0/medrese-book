'use client'

import { ArrowLeftOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons'
import { App, Button, Input, Spin } from 'antd'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

import type { ConversationSummary } from '@/entities/conversation'
import { useMessages, useSendMessage } from '@/entities/conversation'
import { ContactRoleBadge } from '@/features/messaging/ui/ContactRoleBadge'
import { MessageMediaGrid } from '@/features/messaging/ui/MessageMediaGrid'
import Text from '@/shared/ui/Text'

const MAX_ATTACHMENTS = 5
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp'

type DraftAttachment = {
	id: string
	url: string
	previewUrl: string
}

type ChatPanelProps = {
	conversation: ConversationSummary | null
	onBack?: () => void
}

export function ChatPanel({ conversation, onBack }: ChatPanelProps) {
	const { message } = App.useApp()
	const { data: session } = useSession()
	const currentUserId = session?.user?.id
	const readOnly = conversation ? !conversation.isOwn : false
	const { data: messages = [], isLoading } = useMessages(conversation?.id ?? null)
	const sendMessage = useSendMessage(conversation?.id ?? null)
	const [draft, setDraft] = useState('')
	const [attachments, setAttachments] = useState<DraftAttachment[]>([])
	const [uploading, setUploading] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	useEffect(() => {
		setDraft('')
		setAttachments((prev) => {
			prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
			return []
		})
	}, [conversation?.id])

	const canSend =
		(draft.trim().length > 0 || attachments.length > 0) &&
		!uploading &&
		!sendMessage.isPending

	const handlePickFiles = async (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0) return

		const remaining = MAX_ATTACHMENTS - attachments.length
		if (remaining <= 0) {
			message.warning('Можно прикрепить не более 5 фото')
			return
		}

		const selected = Array.from(fileList).slice(0, remaining)
		setUploading(true)
		try {
			const uploaded: DraftAttachment[] = []
			for (const file of selected) {
				if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
					message.error('Допустимы только jpeg, png или webp')
					continue
				}
				const formData = new FormData()
				formData.append('file', file)
				const res = await fetch('/api/uploads', { method: 'POST', body: formData })
				const json = await res.json()
				if (json.error) throw new Error(json.error)
				const url = json.data?.url as string
				uploaded.push({
					id: `${Date.now()}-${file.name}`,
					url,
					previewUrl: URL.createObjectURL(file),
				})
			}
			if (uploaded.length > 0) {
				setAttachments((prev) => [...prev, ...uploaded].slice(0, MAX_ATTACHMENTS))
			}
		} catch (err) {
			message.error(
				err instanceof Error ? err.message : 'Не удалось загрузить фото',
			)
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	const removeAttachment = (id: string) => {
		setAttachments((prev) => {
			const target = prev.find((item) => item.id === id)
			if (target) URL.revokeObjectURL(target.previewUrl)
			return prev.filter((item) => item.id !== id)
		})
	}

	const handleSend = async () => {
		const text = draft.trim()
		const imageUrls = attachments.map((item) => item.url)
		if ((!text && imageUrls.length === 0) || !conversation || readOnly || uploading) {
			return
		}

		const previousDraft = draft
		const previousAttachments = attachments
		setDraft('')
		setAttachments([])

		try {
			await sendMessage.mutateAsync({ body: text, imageUrls })
			previousAttachments.forEach((item) => URL.revokeObjectURL(item.previewUrl))
		} catch {
			setDraft(previousDraft)
			setAttachments(
				previousAttachments.map((item) => ({
					...item,
					previewUrl: item.url,
				})),
			)
			message.error('Не удалось отправить сообщение')
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
							const media = msg.media ?? []
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
										<MessageMediaGrid media={media} />
										{msg.body.trim().length > 0 && (
											<Text className="whitespace-pre-wrap break-words">
												{msg.body}
											</Text>
										)}
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
					{attachments.length > 0 && (
						<div className="mb-2 flex flex-wrap gap-2">
							{attachments.map((item) => (
								<div key={item.id} className="relative">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={item.previewUrl}
										alt="Превью"
										className="h-16 w-16 rounded object-cover"
									/>
									<Button
										type="text"
										size="small"
										aria-label="Удалить фото"
										className="absolute -right-1 -top-1"
										onClick={() => removeAttachment(item.id)}
									>
										×
									</Button>
								</div>
							))}
						</div>
					)}
					<div className="flex gap-2">
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPT_IMAGES}
							multiple
							className="hidden"
							onChange={(e) => void handlePickFiles(e.target.files)}
						/>
						<Button
							icon={<PaperClipOutlined />}
							aria-label="Прикрепить фото"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading || sendMessage.isPending || attachments.length >= MAX_ATTACHMENTS}
						/>
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
							disabled={sendMessage.isPending || uploading}
						/>
						<Button
							type="primary"
							icon={<SendOutlined />}
							aria-label="Отправить"
							onClick={() => void handleSend()}
							loading={sendMessage.isPending || uploading}
							disabled={!canSend}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
