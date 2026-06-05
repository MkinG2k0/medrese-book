import { z } from 'zod'

export const createSessionSchema = z.object({
	studentId: z.string(),
	date: z.string().datetime().or(z.string().date()),
	attendance: z.enum(['PRESENT', 'LATE', 'ABSENT']),
	lateMinutes: z.number().int().min(0).optional().nullable(),
	note: z.string().optional().nullable(),
	completions: z
		.array(
			z.object({
				stepId: z.string(),
				grade: z.number().int().min(1).max(5),
				note: z.string().optional().nullable(),
			}),
		)
		.default([]),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
