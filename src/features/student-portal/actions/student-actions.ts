'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import {
	getLocalStepIdx,
	getStepOffsetForLevel,
	getTotalProgramSteps,
} from '@/shared/lib/student-progress'
import type { StepContent } from '@/shared/lib/validations/step'

export async function getStudentProfile() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			user: true,
			level: true,
			awards: { orderBy: { date: 'desc' } },
		},
	})

	if (!student) return null

	const totalSteps = await getTotalProgramSteps()

	return {
		name: student.user.name,
		currentStepIdx: student.currentStepIdx,
		totalSteps,
		levelTitle: `${student.level.number}й уровень — ${student.level.title}`,
		awards: student.awards,
	}
}

export async function getStudentLessons() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			sessions: {
				include: { completions: { include: { step: true } } },
				orderBy: { date: 'desc' },
				take: 50,
			},
		},
	})

	if (!student) return null

	const steps = student.level.steps
	const stepOffset = await getStepOffsetForLevel(student.level.number)
	const localStepIdx = getLocalStepIdx(student.currentStepIdx, stepOffset)
	const currentStep =
		localStepIdx >= 0 && localStepIdx < steps.length
			? steps[localStepIdx]
			: undefined

	return {
		currentStep: currentStep
			? {
					title: currentStep.title,
					content: currentStep.content as StepContent,
				}
			: null,
		sessions: student.sessions,
	}
}
