import { z } from 'zod'

export const teacherLessonTimeFieldSchema = z.enum([
	'login',
	'logout',
	'lessonStart',
	'lessonEnd',
])

export const updateTeacherLessonTimeSchema = z.object({
	teacherId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректная дата'),
	field: teacherLessonTimeFieldSchema,
	time: z.string().regex(/^\d{2}:\d{2}$/, 'Некорректное время'),
})

export const clearTeacherLessonTimeSchema = z.object({
	teacherId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректная дата'),
	field: teacherLessonTimeFieldSchema,
})

export type TeacherLessonTimeField = z.infer<typeof teacherLessonTimeFieldSchema>
export type UpdateTeacherLessonTimeInput = z.infer<
	typeof updateTeacherLessonTimeSchema
>
export type ClearTeacherLessonTimeInput = z.infer<
	typeof clearTeacherLessonTimeSchema
>
