'use server'

import { prisma } from '@/shared/lib/prisma'
import { recalculateStudentStepIdx } from '@/shared/lib/recalculate-step-progress'
import { requireRole } from '@/shared/lib/session'
import {
	filterIncompleteSteps,
	getCompletionsByStepId,
	sumPassedStepHours,
} from '@/shared/lib/step-completion'
import { getTotalProgramSteps } from '@/shared/lib/step-offset'
import type { StepContent } from '@/shared/lib/validations/step'

export async function getTeacherGroup() {
	const session = await requireRole('TEACHER')

	const group = await prisma.group.findFirst({
		where: { teacherId: session.user.teacherId! },
	})

	return group
}

export type JournalStep = {
	id: string
	order: number
	title: string
	content: StepContent
	description: string
	hours: number
	levelNumber: number
	levelTitle: string
}

export async function getStudentLesson(studentId: string) {
	const session = await requireRole('TEACHER')

	await recalculateStudentStepIdx(studentId)

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			completions: { orderBy: { createdAt: 'asc' } },
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			group: true,
		},
	})

	if (!student) return null
	if (student.group.teacherId !== session.user.teacherId) return null

	const nextLevel = await prisma.level.findFirst({
		where: { number: student.level.number + 1 },
		include: { steps: { orderBy: { order: 'asc' } } },
	})

	const totalProgramSteps = await getTotalProgramSteps()

	const mapStep = (step: (typeof student.level.steps)[number]): JournalStep => ({
		id: step.id,
		order: step.order,
		title: step.title,
		content: step.content as StepContent,
		description: step.description,
		hours: step.hours,
		levelNumber: student.level.number,
		levelTitle: student.level.title,
	})

	const allSteps = student.level.steps.map(mapStep)
	const nextLevelSteps =
		nextLevel?.steps.map((step) => ({
			id: step.id,
			order: step.order,
			title: step.title,
			content: step.content as StepContent,
			description: step.description,
			hours: step.hours,
			levelNumber: nextLevel.number,
			levelTitle: nextLevel.title,
		})) ?? []
	const completionsByStepId = getCompletionsByStepId(student.completions)
	const incompleteSteps = filterIncompleteSteps(allSteps, completionsByStepId)
	const totalHours = sumPassedStepHours(allSteps, completionsByStepId)

	const groupStudents = await prisma.student.findMany({
		where: { groupId: student.groupId },
		include: { user: true },
	})
	const sortedStudents = [...groupStudents].sort((a, b) =>
		a.user.name.localeCompare(b.user.name),
	)
	const currentIndex = sortedStudents.findIndex((s) => s.id === studentId)
	const nextStudent = sortedStudents[currentIndex + 1] ?? null

	const stepCompletionsByStep = new Map<
		string,
		{ stepId: string; grade: number; note: string | null }
	>()
	for (const completion of student.completions) {
		stepCompletionsByStep.set(completion.stepId, {
			stepId: completion.stepId,
			grade: completion.grade,
			note: completion.note,
		})
	}

	return {
		student: {
			id: student.id,
			name: student.user.name,
			currentStepIdx: student.currentStepIdx,
		},
		level: {
			number: student.level.number,
			title: student.level.title,
		},
		totalSteps: allSteps.length,
		totalProgramSteps,
		totalHours,
		allSteps,
		nextLevelSteps,
		stepCompletions: [...stepCompletionsByStep.values()],
		steps: incompleteSteps,
		nextStudent: nextStudent
			? { id: nextStudent.id, name: nextStudent.user.name }
			: null,
	}
}

export async function getStudentStepHistory(studentId: string) {
	const session = await requireRole('TEACHER')

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			level: true,
			group: true,
		},
	})

	if (!student) return null
	if (student.group.teacherId !== session.user.teacherId) return null

	return {
		student: {
			id: student.id,
			name: student.user.name,
			currentStepIdx: student.currentStepIdx,
		},
		level: {
			number: student.level.number,
			title: student.level.title,
		},
	}
}
