'use server'

import { revalidatePath } from 'next/cache'

import {
	getCalendarDayQueryRange,
	getLocalDateString,
	toSessionDate,
} from '@/shared/lib/calendar-date'
import { requireStudentEditAccess } from '@/shared/lib/authorize-student-access'
import { prisma, type Prisma } from '@/shared/lib/prisma'
import { PASSING_GRADE } from '@/shared/lib/step-completion'
import { getStepOffsetForLevel } from '@/shared/lib/step-offset'
import { updateStudentProgressSchema } from '@/shared/lib/validations/student-progress'

type Tx = Prisma.TransactionClient

async function syncCompletionsForProgress(
	tx: Tx,
	studentId: string,
	levelSteps: { id: string }[],
	localStepIndex: number,
) {
	const passedStepIds = levelSteps.slice(0, localStepIndex).map((s) => s.id)
	const futureStepIds = levelSteps.slice(localStepIndex).map((s) => s.id)

	if (futureStepIds.length > 0) {
		await tx.stepCompletion.deleteMany({
			where: { studentId, stepId: { in: futureStepIds } },
		})
	}

	if (passedStepIds.length === 0) return

	const today = getLocalDateString()
	const dayRange = getCalendarDayQueryRange(today)
	let adjustmentSession = await tx.session.findFirst({
		where: {
			studentId,
			date: { gte: dayRange.start, lte: dayRange.end },
		},
	})

	if (!adjustmentSession) {
		adjustmentSession = await tx.session.create({
			data: {
				studentId,
				date: toSessionDate(today),
				attendance: 'PRESENT',
				note: 'Корректировка прогресса',
			},
		})
	}

	const existingCompletions = await tx.stepCompletion.findMany({
		where: { studentId, stepId: { in: passedStepIds } },
	})

	const existingByStepId = new Map(
		existingCompletions.map((c) => [c.stepId, c]),
	)

	for (const stepId of passedStepIds) {
		const existing = existingByStepId.get(stepId)
		if (existing) {
			if (existing.grade < PASSING_GRADE) {
				await tx.stepCompletion.update({
					where: { id: existing.id },
					data: { grade: PASSING_GRADE },
				})
			}
		} else {
			await tx.stepCompletion.create({
				data: {
					studentId,
					stepId,
					sessionId: adjustmentSession.id,
					grade: PASSING_GRADE,
				},
			})
		}
	}
}

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
	const { student } = await requireStudentEditAccess(studentId)
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
	})

	revalidatePath('/groups')
	revalidatePath(`/groups/${student.groupId}`)
	revalidatePath('/journal')
	revalidatePath(`/journal/${studentId}`)
	revalidatePath(`/students/${studentId}/edit`)
	revalidatePath('/student/me')

	return { currentStepIdx }
}
