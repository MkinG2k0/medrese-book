import { z } from 'zod'

export const createGroupSchema = z.object({
	name: z.string().min(1),
	teacherId: z.string(),
	subjectId: z.string().min(1, 'Выберите предмет'),
})

export const updateGroupSchema = z.object({
	name: z.string().min(1),
	teacherId: z.string(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
