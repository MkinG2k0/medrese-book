import { z } from 'zod'

export const createSessionSchema = z.object({
	studentId: z.string(),
	groupId: z.string().min(1, 'groupId обязателен'),
	date: z.string().datetime().or(z.string().date()),
	attendance: z.enum(['PRESENT', 'LATE', 'ABSENT']),
	lateMinutes: z.number().int().min(0).optional().nullable(),
	note: z.string().optional().nullable(),
	completions: z
		.array(
			z.object({
				stepId: z.string(),
				grade: z.union([z.literal(3), z.literal(4), z.literal(5)]),
				note: z.string().optional().nullable(),
			}),
		)
		.default([]),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
