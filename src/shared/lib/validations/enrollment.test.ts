import { describe, expect, it } from 'vitest'

import { createGroupSchema, updateGroupSchema } from './group'
import {
	assertLevelBelongsToGroupSubject,
	enrollStudentSchema,
} from './enrollment'

describe('group schemas', () => {
	it('createGroupSchema отклоняет пустой subjectId', () => {
		const result = createGroupSchema.safeParse({
			name: 'Группа 1',
			teacherId: 'teacher-1',
			subjectId: '',
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe('Выберите предмет')
		}
	})

	it('updateGroupSchema не содержит поля subjectId', () => {
		const result = updateGroupSchema.safeParse({
			name: 'Группа 1',
			teacherId: 'teacher-1',
			subjectId: 'sub-1',
		})

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).not.toHaveProperty('subjectId')
		}
	})
})

describe('enrollment schemas', () => {
	it('enrollStudentSchema принимает localStepIndex', () => {
		const result = enrollStudentSchema.safeParse({
			studentId: 'student-1',
			levelId: 'level-1',
			localStepIndex: 2,
		})

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.localStepIndex).toBe(2)
		}
	})

	it('enrollStudentSchema отклоняет пустой levelId', () => {
		const result = enrollStudentSchema.safeParse({
			studentId: 'student-1',
			levelId: '',
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(
				result.error.issues.some((issue) => issue.path.includes('levelId')),
			).toBe(true)
		}
	})
})

describe('assertLevelBelongsToGroupSubject', () => {
	it('возвращает ошибку когда level.subjectId !== group.subjectId', () => {
		expect(() =>
			assertLevelBelongsToGroupSubject('sub-quran', 'sub-arabic'),
		).toThrow('Уровень не принадлежит предмету группы')
	})

	it('не бросает когда subjectId совпадают', () => {
		expect(() =>
			assertLevelBelongsToGroupSubject('sub-quran', 'sub-quran'),
		).not.toThrow()
	})
})
