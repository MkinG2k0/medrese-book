'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import {
	getLocalStepIdx,
	getStepOffsetForLevel,
	getTotalProgramSteps,
} from '@/shared/lib/step-offset'
import type { StepContent } from '@/shared/lib/validations/step'

export async function getStudentProfile() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			user: true,
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			sessions: {
				include: { completions: { include: { step: true } } },
				orderBy: { date: 'desc' },
				take: 20,
			},
			awards: { orderBy: { date: 'desc' } },
		},
	})

	if (!student) return null

	const steps = student.level.steps
	const stepOffset = await getStepOffsetForLevel(student.level.number)
	const totalSteps = await getTotalProgramSteps()
	const localStepIdx = getLocalStepIdx(student.currentStepIdx, stepOffset)
	const currentStep =
		localStepIdx >= 0 && localStepIdx < steps.length
			? steps[localStepIdx]
			: undefined

	return {
		name: student.user.name,
		currentStepIdx: student.currentStepIdx,
		totalSteps,
		currentStep: currentStep
			? {
					title: currentStep.title,
					content: currentStep.content as StepContent,
				}
			: null,
		levelTitle: student.level.title,
		sessions: student.sessions,
		awards: student.awards,
	}
}
