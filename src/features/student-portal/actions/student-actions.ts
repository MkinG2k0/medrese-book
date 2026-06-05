'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import type { StepContent } from '@/shared/lib/validations/step'

export async function getStudentProfile() {
	const session = await requireRole('STUDENT')

	const student = await prisma.student.findUnique({
		where: { id: session.user.studentId! },
		include: {
			user: true,
			group: {
				include: {
					level: { include: { steps: { orderBy: { order: 'asc' } } } },
				},
			},
			sessions: {
				include: { completions: { include: { step: true } } },
				orderBy: { date: 'desc' },
				take: 20,
			},
			awards: { orderBy: { date: 'desc' } },
		},
	})

	if (!student) return null

	const steps = student.group.level.steps
	const currentStep = steps[student.currentStepIdx]

	return {
		name: student.user.name,
		currentStepIdx: student.currentStepIdx,
		totalSteps: steps.length,
		currentStep: currentStep
			? {
					title: currentStep.title,
					type: currentStep.type,
					content: currentStep.content as StepContent,
				}
			: null,
		levelTitle: student.group.level.title,
		sessions: student.sessions,
		awards: student.awards,
	}
}
