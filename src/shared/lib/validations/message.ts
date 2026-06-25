import { z } from 'zod'

export const sendMessageSchema = z.object({
	body: z
		.string()
		.trim()
		.min(1, 'Сообщение не может быть пустым')
		.max(4000, 'Сообщение слишком длинное'),
})

export const createConversationSchema = z.object({
	recipientId: z.string().min(1, 'Укажите получателя'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
