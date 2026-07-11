import { describe, expect, it } from 'vitest'

import { updateStudentProgressSchema } from './student-progress'

describe('updateStudentProgressSchema', () => {
	it('отклоняет payload без groupId', () => {
		const result = updateStudentProgressSchema.safeParse({
			levelId: 'level-1',
			localStepIndex: 0,
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(
				result.error.issues.some((issue) => issue.path.includes('groupId')),
			).toBe(true)
		}
	})

	it('принимает валидный payload с groupId', () => {
		const result = updateStudentProgressSchema.safeParse({
			groupId: 'group-1',
			levelId: 'level-1',
			localStepIndex: 2,
		})

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toEqual({
				groupId: 'group-1',
				levelId: 'level-1',
				localStepIndex: 2,
			})
		}
	})
})
