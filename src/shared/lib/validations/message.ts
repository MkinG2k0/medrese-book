import { z } from 'zod'

import { isAllowedMessageMediaUrl } from '@/shared/lib/messaging/is-allowed-message-media-url'

export const sendMessageSchema = z
	.object({
		body: z
			.string()
			.trim()
			.max(4000, 'Сообщение слишком длинное')
			.default(''),
		imageUrls: z
			.array(z.string().min(1, 'Укажите URL изображения'))
			.max(5, 'Можно прикрепить не более 5 фото')
			.default([]),
	})
	.superRefine((data, ctx) => {
		if (data.body.length === 0 && data.imageUrls.length === 0) {
			ctx.addIssue({
				code: 'custom',
				message: 'Сообщение не может быть пустым',
				path: ['body'],
			})
		}

		data.imageUrls.forEach((url, index) => {
			if (!isAllowedMessageMediaUrl(url)) {
				ctx.addIssue({
					code: 'custom',
					message: 'Недопустимый URL изображения',
					path: ['imageUrls', index],
				})
			}
		})
	})

export const createConversationSchema = z.object({
	recipientId: z.string().min(1, 'Укажите получателя'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
