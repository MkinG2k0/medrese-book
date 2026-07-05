import { z } from 'zod'

const postMediaSchema = z.object({
	type: z.enum(['IMAGE', 'VIDEO']),
	url: z
		.string()
		.trim()
		.min(1, 'URL медиа обязателен')
		.refine(
			(value) =>
				value.startsWith('http://') ||
				value.startsWith('https://') ||
				value.startsWith('/'),
			'Некорректный URL медиа',
		),
	sortOrder: z.number().int().min(0).optional(),
})

export const createPostSchema = z.object({
	title: z.string().trim().min(2, 'Заголовок не короче 2 символов').max(200),
	body: z
		.object({ type: z.string() })
		.passthrough(),
	media: z.array(postMediaSchema).max(20, 'Не более 20 медиафайлов').default([]),
})

export const updatePostSchema = createPostSchema

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostMediaInput = z.infer<typeof postMediaSchema>
