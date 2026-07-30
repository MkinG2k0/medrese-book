import { describe, expect, it } from 'vitest'

import { createSessionSchema } from './session'

describe('createSessionSchema', () => {
	it('отклоняет пустой groupId', () => {
		const result = createSessionSchema.safeParse({
			studentId: 'student-1',
			groupId: '',
			date: '2026-07-11',
			attendance: 'PRESENT',
			completions: [],
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe('groupId обязателен')
		}
	})

	it('принимает валидный payload с groupId', () => {
		const result = createSessionSchema.safeParse({
			studentId: 'student-1',
			groupId: 'group-1',
			date: '2026-07-11',
			attendance: 'PRESENT',
			completions: [],
		})

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.groupId).toBe('group-1')
		}
	})

	it('принимает ABSENT с absenceExcused и absenceReason', () => {
		const result = createSessionSchema.safeParse({
			studentId: 'student-1',
			groupId: 'group-1',
			date: '2026-07-11',
			attendance: 'ABSENT',
			absenceExcused: true,
			absenceReason: 'Болезнь',
			completions: [],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.absenceExcused).toBe(true)
			expect(result.data.absenceReason).toBe('Болезнь')
		}
	})

	it('при PRESENT сбрасывает absenceExcused и absenceReason', () => {
		const result = createSessionSchema.safeParse({
			studentId: 'student-1',
			groupId: 'group-1',
			date: '2026-07-11',
			attendance: 'PRESENT',
			absenceExcused: true,
			absenceReason: 'не должно сохраниться',
			completions: [],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.absenceExcused).toBe(false)
			expect(result.data.absenceReason).toBeNull()
		}
	})

	it('пустую причину нормализует в null', () => {
		const result = createSessionSchema.safeParse({
			studentId: 'student-1',
			groupId: 'group-1',
			date: '2026-07-11',
			attendance: 'ABSENT',
			absenceExcused: false,
			absenceReason: '   ',
			completions: [],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.absenceReason).toBeNull()
		}
	})
})
