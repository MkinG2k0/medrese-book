import { z } from 'zod'

export const teachingSessionQuerySchema = z.object({
	groupId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const startTeachingSessionSchema = z.object({
	groupId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const endTeachingSessionSchema = z.object({
	action: z.literal('end'),
})

export type TeachingSessionQuery = z.infer<typeof teachingSessionQuerySchema>
export type StartTeachingSessionInput = z.infer<
	typeof startTeachingSessionSchema
>
