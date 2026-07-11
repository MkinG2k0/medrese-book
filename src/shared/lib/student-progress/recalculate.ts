import { findEnrollmentInGroup } from '@/shared/lib/enrollment'
import { prisma, type Prisma } from '@/shared/lib/prisma'
import {
	countConsecutivePassedSteps,
	getCompletionsByStepId,
	isStepPassed,
} from '@/shared/lib/step-completion'

import { getStepOffsetForLevel } from './offsets'

type Tx = Prisma.TransactionClient

/**
 * Пересчитывает глобальный индекс шага для зачисления ученика в группе.
 * С Phase 12 требует `groupId` — прогресс хранится на GroupEnrollment, не на Student.
 */
export async function recalculateStudentStepIdx(
	studentId: string,
	groupId: string,
	tx?: Tx,
) {
	const db = tx ?? prisma

	const enrollment = await findEnrollmentInGroup(studentId, groupId, db)

	if (!enrollment) return

	const level = enrollment.level
	const levelStepIds = level.steps.map((step) => step.id)
	const levelCompletions =
		levelStepIds.length === 0
			? []
			: await db.stepCompletion.findMany({
					where: { studentId, stepId: { in: levelStepIds } },
					select: { stepId: true, grade: true },
					orderBy: { createdAt: 'asc' },
				})

	const subjectId = enrollment.group.subjectId
	const stepOffset = await getStepOffsetForLevel(level.number, subjectId)
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
			where: { number: level.number + 1, subjectId },
		})

		if (nextLevel) {
			await db.groupEnrollment.update({
				where: { id: enrollment.id },
				data: { levelId: nextLevel.id, currentStepIdx: newIdx },
			})
			return newIdx
		}
	}

	if (newIdx !== enrollment.currentStepIdx) {
		await db.groupEnrollment.update({
			where: { id: enrollment.id },
			data: { currentStepIdx: newIdx },
		})
	}

	return newIdx
}
