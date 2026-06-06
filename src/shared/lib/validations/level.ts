import { z } from 'zod'

export const createLevelSchema = z.object({
	number: z.number().int().min(1),
	title: z.string().min(1),
})

export const updateLevelSchema = createLevelSchema.partial()

export type CreateLevelInput = z.infer<typeof createLevelSchema>
export type UpdateLevelInput = z.infer<typeof updateLevelSchema>
