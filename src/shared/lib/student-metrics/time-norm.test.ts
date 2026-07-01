import { describe, expect, it } from 'vitest'

import { evaluateTimeNormForLevel } from './time-norm'

describe('evaluateTimeNormForLevel', () => {
	it('marks violation when actual minutes exceed budget on level', () => {
		const result = evaluateTimeNormForLevel({
			levelId: 'level-1',
			actualMinutes: 300,
			completedStepsOnLevel: [{ hours: 4 }],
		})

		expect(result).toEqual({
			levelId: 'level-1',
			actualMinutes: 300,
			budgetMinutes: 240,
			isViolated: true,
		})
	})
})
