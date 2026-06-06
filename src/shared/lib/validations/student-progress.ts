import { z } from 'zod'

export const updateStudentProgressSchema = z.object({
	levelId: z.string().min(1),
	localStepIndex: z.number().int().min(0),
})

export type UpdateStudentProgressInput = z.infer<typeof updateStudentProgressSchema>
