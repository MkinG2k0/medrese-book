import { z } from 'zod'

export const markNotificationReadSchema = z.union([
	z.object({
		ids: z
			.array(z.string().min(1, 'Некорректный идентификатор уведомления'))
			.min(1, 'Укажите хотя бы одно уведомление'),
	}),
	z.object({
		all: z.literal(true),
	}),
])

export type MarkNotificationReadInput = z.infer<
	typeof markNotificationReadSchema
>
