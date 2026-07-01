import { z } from 'zod'

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const teachingSessionQuerySchema = z.object({
	groupId: z.string().min(1),
	date: calendarDateSchema,
})

export const teachingSessionDatesQuerySchema = z
	.object({
		groupId: z.string().min(1),
		from: calendarDateSchema,
		to: calendarDateSchema,
	})
	.refine(({ from, to }) => from <= to, {
		message: 'Дата начала не может быть позже даты окончания',
	})

export const startTeachingSessionSchema = z.object({
	groupId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const endTeachingSessionSchema = z.object({
	action: z.literal('end'),
})

export type TeachingSessionQuery = z.infer<typeof teachingSessionQuerySchema>
export type TeachingSessionDatesQuery = z.infer<
	typeof teachingSessionDatesQuerySchema
>
export type StartTeachingSessionInput = z.infer<
	typeof startTeachingSessionSchema
>
