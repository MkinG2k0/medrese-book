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

export type JournalStep = {
	id: string
	order: number
	title: string
	type: 'LETTER' | 'SURAH'
	content: StepContent
	hours: number
}

export async function getStudentLesson(studentId: string) {
	const session = await requireRole('TEACHER')

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			group: {
				include: {
					level: { include: { steps: { orderBy: { order: 'asc' } } } },
				},
			},
		},
	})

	if (!student) return null
	if (student.group.teacherId !== session.user.teacherId) return null

	const allSteps = student.group.level.steps
	const remainingSteps = allSteps.slice(student.currentStepIdx).map((step) => ({
		id: step.id,
		order: step.order,
		title: step.title,
		type: step.type,
		content: step.content as StepContent,
		hours: step.hours,
	}))

	const totalHours = allSteps
		.slice(0, student.currentStepIdx)
		.reduce((sum, step) => sum + step.hours, 0)

	const groupStudents = await prisma.student.findMany({
		where: { groupId: student.groupId },
		include: { user: true },
	})
	const sortedStudents = [...groupStudents].sort((a, b) =>
		a.user.name.localeCompare(b.user.name),
	)
	const currentIndex = sortedStudents.findIndex((s) => s.id === studentId)
	const nextStudent = sortedStudents[currentIndex + 1] ?? null

	return {
		student: {
			id: student.id,
			name: student.user.name,
			currentStepIdx: student.currentStepIdx,
		},
		level: {
			number: student.group.level.number,
			title: student.group.level.title,
		},
		totalSteps: allSteps.length,
		totalHours,
		steps: remainingSteps,
		nextStudent: nextStudent
			? { id: nextStudent.id, name: nextStudent.user.name }
			: null,
	}
}
