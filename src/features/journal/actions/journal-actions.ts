'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRole } from '@/shared/lib/session'
import type { StepContent } from '@/shared/lib/validations/step'

export async function getTeacherGroup() {
	const session = await requireRole('TEACHER')

	const group = await prisma.group.findFirst({
		where: { teacherId: session.user.teacherId! },
		include: { level: { include: { steps: { orderBy: { order: 'asc' } } } } },
	})

	return group
}

export async function getStudentLesson(studentId: string) {
	const session = await requireRole('TEACHER')

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			group: { include: { level: { include: { steps: { orderBy: { order: 'asc' } } } } } },
		},
	})

	if (!student) return null
	if (student.group.teacherId !== session.user.teacherId) return null

	const steps = student.group.level.steps
	const currentStep = steps[student.currentStepIdx] ?? null

	return {
		student: { id: student.id, name: student.user.name, currentStepIdx: student.currentStepIdx },
		step: currentStep
			? {
					id: currentStep.id,
					title: currentStep.title,
					type: currentStep.type,
					content: currentStep.content as StepContent,
				}
			: null,
	}
}
