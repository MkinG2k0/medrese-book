import type { TimeNormResult } from './types'

export type EvaluateTimeNormInput = {
	levelId: string
	actualMinutes: number
	completedStepsOnLevel: Array<{ hours: number; isPriorCredit?: boolean }>
}

export function evaluateTimeNormForLevel(
	input: EvaluateTimeNormInput,
): TimeNormResult {
	const budgetMinutes = input.completedStepsOnLevel
		.filter((step) => !step.isPriorCredit)
		.reduce((sum, step) => sum + step.hours * 60, 0)

	return {
		levelId: input.levelId,
		actualMinutes: input.actualMinutes,
		budgetMinutes,
		isViolated: input.actualMinutes > budgetMinutes,
	}
}
