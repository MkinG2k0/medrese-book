'use server'

import { revalidatePath } from 'next/cache'

import { requireStudentEditAccess } from '@/shared/lib/authorize-student-access'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import {
	getStepOffsetForLevel,
	recalculateStudentStepIdx,
	syncCompletionsForProgress,
} from '@/shared/lib/student-progress'
import { updateStudentProgressSchema } from '@/shared/lib/validations/student-progress'

export async function getStudentProgressEdit(studentId: string) {
	const { student } = await requireStudentEditAccess(studentId)
	if (!student) return null

	const [levels, stepOffset] = await Promise.all([
		prisma.level.findMany({
			include: { steps: { orderBy: { order: 'asc' } } },
			orderBy: { number: 'asc' },
		}),
		getStepOffsetForLevel(student.level.number),
	])

	const currentLevel = levels.find((l) => l.id === student.levelId)
	const stepCount = currentLevel?.steps.length ?? 0
	const localStepIndex = Math.min(
		Math.max(0, student.currentStepIdx - stepOffset),
		Math.max(0, stepCount - 1),
	)

	return {
		student: {
			id: student.id,
			name: student.user.name,
			groupId: student.groupId,
			groupName: student.group.name,
			levelId: student.levelId,
			currentStepIdx: student.currentStepIdx,
			localStepIndex,
		},
		levels: levels.map((level) => ({
			id: level.id,
			number: level.number,
			title: level.title,
			steps: level.steps.map((step) => ({
				id: step.id,
				order: step.order,
				title: step.title,
			})),
		})),
		currentLevelNumber: currentLevel?.number ?? student.level.number,
	}
}

export async function updateStudentProgress(studentId: string, input: unknown) {
	const { session, student } = await requireStudentEditAccess(studentId)
	if (!student) throw new Error('Ученик не найден')

	const data = updateStudentProgressSchema.parse(input)

	const level = await prisma.level.findUnique({
		where: { id: data.levelId },
		include: { steps: { orderBy: { order: 'asc' } } },
	})

	if (!level) throw new Error('Уровень не найден')

	if (data.localStepIndex > level.steps.length) {
		throw new Error('Шаг выходит за пределы уровня')
	}

	const stepOffset = await getStepOffsetForLevel(level.number)
	const currentStepIdx = stepOffset + data.localStepIndex
	const previousLevelId = student.levelId
	const previousStepIdx = student.currentStepIdx

	await prisma.$transaction(async (tx) => {
		await syncCompletionsForProgress(
			tx,
			studentId,
			level.steps,
			data.localStepIndex,
		)

		await tx.student.update({
			where: { id: studentId },
			data: {
				levelId: data.levelId,
				currentStepIdx,
			},
		})

		await recalculateStudentStepIdx(studentId, tx)

		await dispatchDomainEvent(
			{
				actorId: session.user.id,
				action: 'STUDENT_PROGRESS_CHANGED',
				entityType: 'Student',
				entityId: studentId,
				payload: {
					previousLevelId,
					previousStepIdx,
					levelId: data.levelId,
					currentStepIdx,
					localStepIndex: data.localStepIndex,
				},
			},
			tx,
		)
	})

	revalidatePath('/groups')
	revalidatePath('/my-group')
	revalidatePath(`/groups/${student.groupId}`)
	revalidatePath('/journal')
	revalidatePath(`/journal/${studentId}`)
	revalidatePath(`/students/${studentId}/edit`)
	revalidatePath('/student/me')

	return { currentStepIdx }
}
