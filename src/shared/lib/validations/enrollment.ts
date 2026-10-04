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

const uniqueStudentIds = z
	.array(z.string().min(1))
	.min(1, 'Выберите хотя бы одного ученика')
	.refine(
		(ids) => new Set(ids).size === ids.length,
		'Список учеников содержит дубликаты',
	)

export const unenrollStudentSchema = z.object({
	studentId: z.string().min(1),
})

export const unenrollStudentsSchema = z.object({
	studentIds: uniqueStudentIds,
})

export const transferStudentSchema = z.object({
	studentId: z.string().min(1, 'Выберите ученика'),
	toGroupId: z.string().min(1, 'Выберите группу'),
})

export const transferStudentsSchema = z.object({
	studentIds: uniqueStudentIds,
	toGroupId: z.string().min(1, 'Выберите группу'),
})

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>
export type EnrollStudentsInput = z.infer<typeof enrollStudentsSchema>
export type UnenrollStudentInput = z.infer<typeof unenrollStudentSchema>
export type UnenrollStudentsInput = z.infer<typeof unenrollStudentsSchema>
export type TransferStudentInput = z.infer<typeof transferStudentSchema>
export type TransferStudentsInput = z.infer<typeof transferStudentsSchema>

export function assertLevelBelongsToGroupSubject(
	groupSubjectId: string,
	levelSubjectId: string,
): void {
	if (levelSubjectId !== groupSubjectId) {
		throw new Error('Уровень не принадлежит предмету группы')
	}
}
