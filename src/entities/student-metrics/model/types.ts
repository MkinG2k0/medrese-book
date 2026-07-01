import { z } from 'zod'

import type { LevelProgress } from '@/shared/lib/student-metrics/period-metrics'
import type { RiskFlag } from '@/shared/lib/student-metrics/types'

export type StudentMetricsResponse = {
	lessonsCount: number
	stepsCount: number
	totalMinutes: number
	levelProgress: LevelProgress
}

export type AtRiskStudentApiRow = {
	student: { id: string; name: string }
	teacherName: string
	levelTitle: string
	riskFlags: RiskFlag[]
	absencesInMonth: number
	actualMinutes: number
	budgetMinutes: number
}

export type StudentRiskFlagEntry = {
	studentId: string
	riskFlags: RiskFlag[]
}

export const studentMetricsQuerySchema = z.object({
	studentId: z.string().min(1, 'studentId обязателен'),
	month: z
		.string()
		.regex(/^\d{4}-\d{2}$/, 'month должен быть в формате YYYY-MM')
		.optional(),
})

export const atRiskStudentsQuerySchema = z.object({
	month: z
		.string()
		.regex(/^\d{4}-\d{2}$/, 'month должен быть в формате YYYY-MM')
		.optional(),
	teacher: z.string().optional(),
})

export const studentRiskFlagsQuerySchema = z.object({
	groupId: z.string().min(1, 'groupId обязателен'),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'date должен быть в формате YYYY-MM-DD'),
})
