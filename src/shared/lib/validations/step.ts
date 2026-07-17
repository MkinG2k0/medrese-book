import { z } from 'zod'

const contentBlockSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('text'), value: z.string() }),
	z.object({
		type: z.literal('arabic'),
		value: z.string(),
		size: z.enum(['md', 'lg', 'xl']).optional(),
	}),
	z.object({
		type: z.literal('image'),
		url: z.string(),
		caption: z.string().nullish(),
	}),
	z.object({ type: z.literal('list'), items: z.array(z.string()) }),
])

export const stepContentSchema = z.object({
	blocks: z.array(contentBlockSchema),
})

export const createStepSchema = z.object({
	levelId: z.string(),
	order: z.number().int().min(1),
	title: z.string().min(1),
	content: stepContentSchema,
	teacherNote: stepContentSchema.optional().default({ blocks: [] }),
	pdfUrl: z.string().min(1).nullable().optional(),
	hours: z.number().int().min(1),
})

export const updateStepSchema = createStepSchema.partial().extend({
	id: z.string(),
})

export type StepContent = z.infer<typeof stepContentSchema>
export type ContentBlock = z.infer<typeof contentBlockSchema>
