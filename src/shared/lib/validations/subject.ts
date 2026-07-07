import { z } from 'zod'

export const createSubjectSchema = z.object({
	name: z.string().min(2, 'Название должно быть не короче 2 символов'),
	description: z.string().default(''),
})

export const updateSubjectSchema = createSubjectSchema.partial()

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
