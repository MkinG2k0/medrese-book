import { z } from 'zod'

export const enrollStudentSchema = z.object({
	studentId: z.string().min(1, 'Выберите ученика'),
	levelId: z.string().min(1, 'Выберите уровень'),
	localStepIndex: z.number().int().min(0).default(0),
})

export const enrollStudentsSchema = z.object({
	studentIds: z
		.array(z.string().min(1))
		.min(1, 'Выберите хотя бы одного ученика')
		.refine(
			(ids) => new Set(ids).size === ids.length,
			'Список учеников содержит дубликаты',
		),
	levelId: z.string().min(1, 'Выберите уровень'),
	localStepIndex: z.number().int().min(0).default(0),
})

export const unenrollStudentSchema = z.object({
	studentId: z.string().min(1),
})

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>
export type EnrollStudentsInput = z.infer<typeof enrollStudentsSchema>
export type UnenrollStudentInput = z.infer<typeof unenrollStudentSchema>

export function assertLevelBelongsToGroupSubject(
	groupSubjectId: string,
	levelSubjectId: string,
): void {
	if (levelSubjectId !== groupSubjectId) {
		throw new Error('Уровень не принадлежит предмету группы')
	}
}
