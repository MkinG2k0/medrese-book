import { z } from 'zod'

import { stepContentSchema } from '@/shared/lib/validations/step'

export const createExtraAssignmentSchema = z.object({
	title: z.string().min(1, 'Название обязательно'),
	content: stepContentSchema,
	stepId: z.string().nullable().optional(),
})

export const updateExtraAssignmentSchema = createExtraAssignmentSchema.partial()

export const listExtraAssignmentsQuerySchema = z.object({
	authorId: z.string().optional(),
	stepId: z.string().optional(),
	levelId: z.string().optional(),
	title: z.string().optional(),
	subjectId: z.string().optional(),
})

export const assignExtraAssignmentSchema = z.object({
	templateId: z.string().min(1),
	studentId: z.string().min(1),
	sessionId: z.string().min(1),
	displayStepId: z.string().min(1),
})

export const gradeExtraAssignmentSchema = z.object({
	grade: z.union([z.literal(3), z.literal(4), z.literal(5)]),
	note: z.string().nullable().optional(),
})

export const extraAssignmentHistoryQuerySchema = z.object({
	studentId: z.string().optional(),
	subjectId: z.string().optional(),
})

export type CreateExtraAssignmentInput = z.infer<typeof createExtraAssignmentSchema>
export type UpdateExtraAssignmentInput = z.infer<typeof updateExtraAssignmentSchema>
export type AssignExtraAssignmentInput = z.infer<typeof assignExtraAssignmentSchema>
export type GradeExtraAssignmentInput = z.infer<typeof gradeExtraAssignmentSchema>
export type ExtraAssignmentHistoryQuery = z.infer<
	typeof extraAssignmentHistoryQuerySchema
>
