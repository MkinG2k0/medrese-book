import { z } from 'zod'

export const pushSubscriptionSchema = z.object({
	endpoint: z.string().url('Некорректный endpoint подписки'),
	keys: z.object({
		p256dh: z.string().min(1, 'Отсутствует ключ p256dh'),
		auth: z.string().min(1, 'Отсутствует ключ auth'),
	}),
})

export const pushUnsubscribeSchema = z.object({
	endpoint: z.string().url('Некорректный endpoint подписки').optional(),
})

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>
