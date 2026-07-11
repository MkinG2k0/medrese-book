import { z } from 'zod'

export const teacherLessonTimeFieldSchema = z.enum([
	'login',
	'logout',
	'lessonStart',
	'lessonEnd',
])

export const updateTeacherLessonTimeSchema = z
	.object({
		teacherId: z.string().min(1),
		groupId: z.string().min(1).optional(),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректная дата'),
		field: teacherLessonTimeFieldSchema,
		time: z.string().regex(/^\d{2}:\d{2}$/, 'Некорректное время'),
	})
	.refine(
		(data) =>
			data.field === 'login' ||
			data.field === 'logout' ||
			Boolean(data.groupId),
		{ message: 'Укажите группу', path: ['groupId'] },
	)

export const clearTeacherLessonTimeSchema = z
	.object({
		teacherId: z.string().min(1),
		groupId: z.string().min(1).optional(),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректная дата'),
		field: teacherLessonTimeFieldSchema,
	})
	.refine(
		(data) =>
			data.field === 'login' ||
			data.field === 'logout' ||
			Boolean(data.groupId),
		{ message: 'Укажите группу', path: ['groupId'] },
	)

export type TeacherLessonTimeField = z.infer<typeof teacherLessonTimeFieldSchema>
export type UpdateTeacherLessonTimeInput = z.infer<
	typeof updateTeacherLessonTimeSchema
>
export type ClearTeacherLessonTimeInput = z.infer<
	typeof clearTeacherLessonTimeSchema
>
