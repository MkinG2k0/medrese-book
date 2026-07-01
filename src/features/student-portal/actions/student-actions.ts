'use server'

import { startOfMonth } from 'date-fns'

import { prisma } from '@/shared/lib/prisma'
import { formatAnalyticsMonth } from '@/shared/lib/analytics'
import { requireRole } from '@/shared/lib/session'
import { loadStudentMetricsForMonth } from '@/shared/lib/student-metrics/load-student-metrics'
import type { StudentPeriodMetrics } from '@/shared/lib/student-metrics/types'
import {
	getLocalStepIdx,
	getStepOffsetForLevel,
	getTotalProgramSteps,
} from '@/shared/lib/student-progress'
import { getCompletionsByStepId } from '@/shared/lib/step-completion'
import type { StepContent } from '@/shared/lib/validations/step'

export async function getStudentProfile() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			user: true,
			level: true,
		},
	})

	if (!student) return null

	const totalSteps = await getTotalProgramSteps()

	return {
		name: student.user.name,
		currentStepIdx: student.currentStepIdx,
		totalSteps,
		levelTitle: `${student.level.number}й уровень — ${student.level.title}`,
	}
}

export async function getStudentPeriodMetrics(): Promise<StudentPeriodMetrics | null> {
	const session = await requireRole('STUDENT')
	const studentId = session.user.studentId
	if (!studentId) return null

	const month = startOfMonth(new Date())
	const monthLabel = formatAnalyticsMonth(month)
	const metrics = await loadStudentMetricsForMonth(studentId, month, monthLabel)

	if (!metrics) return null

	return metrics.periodMetrics
}

export async function getStudentAwards() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			awards: { orderBy: { date: 'desc' } },
		},
	})

	if (!student) return null

	return { awards: student.awards }
}

export async function getStudentLessons() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			completions: {
				select: { stepId: true, grade: true },
				orderBy: { createdAt: 'asc' },
			},
		},
	})

	if (!student) return null

	const steps = student.level.steps
	const stepIds = new Set(steps.map((step) => step.id))
	const completionsByStepId = getCompletionsByStepId(
		student.completions.filter((c) => stepIds.has(c.stepId)),
	)
	const stepOffset = await getStepOffsetForLevel(student.level.number)
	const localStepIdx = getLocalStepIdx(student.currentStepIdx, stepOffset)

	return {
		levelTitle: student.level.title,
		lessons: steps.map((step, index) => ({
			id: step.id,
			number: index + 1,
			title: step.title,
			content: step.content as StepContent,
			grade: completionsByStepId.get(step.id)?.grade ?? null,
			isCurrent: index === localStepIdx,
		})),
	}
}

export async function getStudentSessionHistory() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			sessions: {
				include: { completions: { include: { step: true } } },
				orderBy: { date: 'desc' },
				take: 50,
			},
		},
	})

	if (!student) return null

	return { sessions: student.sessions }
}
