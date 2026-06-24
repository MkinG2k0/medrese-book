import {
	getCalendarDayQueryRange,
	getLocalDateString,
	toSessionDate,
} from '@/shared/lib/calendar-date'
import { type Prisma } from '@/shared/lib/prisma'
import { PASSING_GRADE } from '@/shared/lib/step-completion'

type Tx = Prisma.TransactionClient

export async function syncCompletionsForProgress(
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
			isAdjustment: true,
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
				isAdjustment: true,
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
					data: { grade: PASSING_GRADE, isPriorCredit: true },
				})
			}
		} else {
			await tx.stepCompletion.create({
				data: {
					studentId,
					stepId,
					sessionId: adjustmentSession.id,
					grade: PASSING_GRADE,
					isPriorCredit: true,
				},
			})
		}
	}
}
