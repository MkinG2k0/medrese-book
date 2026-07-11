import { z } from 'zod'

export const updateStudentProgressSchema = z.object({
	groupId: z.string().min(1, 'Выберите группу'),
	levelId: z.string().min(1),
	localStepIndex: z.number().int().min(0),
})

export type UpdateStudentProgressInput = z.infer<typeof updateStudentProgressSchema>
