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
import { updateStudentStatusSchema } from '@/shared/lib/validations/student-status'

export async function getStudentProgressEdit(studentId: string) {
	const { student, enrollment } = await requireStudentEditAccess(studentId)
	if (!student || !enrollment) return null

	const [levels, stepOffset] = await Promise.all([
		prisma.level.findMany({
			where: { subjectId: enrollment.group.subjectId },
			include: { steps: { orderBy: { order: 'asc' } } },
			orderBy: { number: 'asc' },
		}),
		getStepOffsetForLevel(enrollment.level.number),
	])

	const currentLevel = levels.find((l) => l.id === enrollment.levelId)
	const stepCount = currentLevel?.steps.length ?? 0
	const localStepIndex = Math.min(
		Math.max(0, student.currentStepIdx - stepOffset),
		Math.max(0, stepCount - 1),
	)

	return {
		student: {
			id: student.id,
			name: student.user.name,
			groupId: enrollment.groupId,
			groupName: enrollment.group.name,
			levelId: enrollment.levelId,
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
		currentLevelNumber: currentLevel?.number ?? enrollment.level.number,
	}
}

export async function updateStudentProgress(studentId: string, input: unknown) {
	const { session, student, enrollment } = await requireStudentEditAccess(studentId)
	if (!student || !enrollment) throw new Error('Ученик не найден')

	const data = updateStudentProgressSchema.parse(input)

	const level = await prisma.level.findFirst({
		where: { id: data.levelId, subjectId: enrollment.group.subjectId },
		include: { steps: { orderBy: { order: 'asc' } } },
	})

	if (!level) throw new Error('Уровень не принадлежит предмету группы')

	if (data.localStepIndex > level.steps.length) {
		throw new Error('Шаг выходит за пределы уровня')
	}

	const stepOffset = await getStepOffsetForLevel(level.number)
	const currentStepIdx = stepOffset + data.localStepIndex
	const previousLevelId = enrollment.levelId
	const previousStepIdx = student.currentStepIdx

	await prisma.$transaction(async (tx) => {
		await syncCompletionsForProgress(
			tx,
			studentId,
			level.steps,
			data.localStepIndex,
		)

		await tx.groupEnrollment.update({
			where: { id: enrollment.id },
			data: { levelId: data.levelId },
		})

		await tx.student.update({
			where: { id: studentId },
			data: { currentStepIdx },
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

	const enrollments = await prisma.groupEnrollment.findMany({
		where: { studentId },
		select: { groupId: true },
	})

	revalidatePath('/groups')
	revalidatePath('/my-group')
	for (const item of enrollments) {
		revalidatePath(`/groups/${item.groupId}`)
	}
	revalidatePath('/journal')
	revalidatePath(`/journal/${studentId}`)
	revalidatePath(`/students/${studentId}/edit`)
	revalidatePath('/student/me')
	revalidatePath('/student/lessons')
	revalidatePath('/student/history')
	revalidatePath('/student/awards')

	return { currentStepIdx }
}

export async function updateStudentStatus(studentId: string, input: unknown) {
	const { session, student, enrollment } = await requireStudentEditAccess(studentId)
	if (!student || !enrollment) throw new Error('Ученик не найден')

	const { status } = updateStudentStatusSchema.parse(input)
	const previousStatus = student.status

	if (previousStatus === status) {
		return { status }
	}

	await prisma.$transaction(async (tx) => {
		await tx.student.update({
			where: { id: studentId },
			data: { status },
		})

		await dispatchDomainEvent(
			{
				actorId: session.user.id,
				action: 'STUDENT_STATUS_CHANGED',
				entityType: 'Student',
				entityId: studentId,
				payload: { previousStatus, status },
			},
			tx,
		)
	})

	const enrollments = await prisma.groupEnrollment.findMany({
		where: { studentId },
		select: { groupId: true },
	})

	revalidatePath('/admin/users')
	revalidatePath('/groups')
	revalidatePath('/my-group')
	for (const item of enrollments) {
		revalidatePath(`/groups/${item.groupId}`)
	}
	revalidatePath('/journal')
	revalidatePath(`/journal/${studentId}`)

	return { status }
}
