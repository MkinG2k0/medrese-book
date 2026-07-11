import { primaryEnrollmentOrderBy } from '@/shared/lib/enrollment'
import { prisma, type Prisma } from '@/shared/lib/prisma'
import {
	countConsecutivePassedSteps,
	getCompletionsByStepId,
	isStepPassed,
} from '@/shared/lib/step-completion'

import { getStepOffsetForLevel } from './offsets'

type Tx = Prisma.TransactionClient

export async function recalculateStudentStepIdx(
	studentId: string,
	tx?: Tx,
) {
	const db = tx ?? prisma

	const enrollment = await db.groupEnrollment.findFirst({
		where: { studentId },
		orderBy: primaryEnrollmentOrderBy,
		include: {
			level: { include: { steps: { orderBy: { order: 'asc' } } } },
			student: { select: { currentStepIdx: true } },
		},
	})

	if (!enrollment) return

	const level = enrollment.level
	const student = enrollment.student
	const levelStepIds = level.steps.map((step) => step.id)
	const levelCompletions =
		levelStepIds.length === 0
			? []
			: await db.stepCompletion.findMany({
					where: { studentId, stepId: { in: levelStepIds } },
					select: { stepId: true, grade: true },
					orderBy: { createdAt: 'asc' },
				})

	const stepOffset = await getStepOffsetForLevel(level.number)
	const completionsByStepId = getCompletionsByStepId(levelCompletions)
	const steps = level.steps
	const passedInCurrentLevel = countConsecutivePassedSteps(
		steps,
		completionsByStepId,
	)
	const newIdx = stepOffset + passedInCurrentLevel

	const allPassed =
		steps.length > 0 &&
		steps.every((step) =>
			isStepPassed(completionsByStepId.get(step.id)?.grade),
		)

	if (allPassed) {
		const nextLevel = await db.level.findFirst({
			where: { number: level.number + 1 },
		})

		if (nextLevel) {
			await db.groupEnrollment.update({
				where: { id: enrollment.id },
				data: { levelId: nextLevel.id },
			})
			await db.student.update({
				where: { id: studentId },
				data: { currentStepIdx: newIdx },
			})
			return newIdx
		}
	}

	if (newIdx !== student.currentStepIdx) {
		await db.student.update({
			where: { id: studentId },
			data: { currentStepIdx: newIdx },
		})
	}

	return newIdx
}
