import { describe, expect, it } from 'vitest'

import { buildCreateUsersPayload, createUsersSchema } from '@/shared/lib/validations/user'

describe('buildCreateUsersPayload parent fields', () => {
	it('передаёт parentId и не шлёт guardian-поля при выбранном опекуне', () => {
		const payload = buildCreateUsersPayload({
			names: 'Ибрагимов Камал',
			role: 'STUDENT',
			studentPhone: '89676123456',
			parentId: 'parent-1',
			guardianName: 'Амина',
			guardianPhone: '89990001122',
			groupId: 'group-1',
			levelId: 'level-1',
			localStepIndex: 0,
		})

		expect(payload.parentId).toBe('parent-1')
		expect(payload.guardianName).toBeUndefined()
		expect(payload.guardianPhone).toBeUndefined()
	})

	it('передаёт guardian-поля когда опекун не выбран', () => {
		const payload = buildCreateUsersPayload({
			names: 'Ибрагимов Камал',
			role: 'STUDENT',
			parentId: undefined,
			guardianName: 'Амина',
			guardianPhone: '89990001122',
			groupId: 'group-1',
			levelId: 'level-1',
			localStepIndex: 0,
		})

		expect(payload.parentId).toBeUndefined()
		expect(payload.guardianName).toBe('Амина')
		expect(payload.guardianPhone).toBe('89990001122')
	})

	it('передаёт studentIds при создании одного опекуна', () => {
		const payload = buildCreateUsersPayload({
			names: 'Ибрагимова Амина',
			role: 'PARENT',
			phone: '89990001122',
			localStepIndex: 0,
			studentIds: ['student-1', 'student-2'],
		})

		expect(payload.role).toBe('PARENT')
		expect(payload.phone).toBe('89990001122')
		expect(payload.studentIds).toEqual(['student-1', 'student-2'])
	})

	it('не передаёт studentIds при создании нескольких опекунов', () => {
		const payload = buildCreateUsersPayload({
			names: 'Амина\nПатимат',
			role: 'PARENT',
			localStepIndex: 0,
			studentIds: ['student-1'],
		})

		expect(payload.entries).toHaveLength(2)
		expect(payload.studentIds).toBeUndefined()
	})

	it('не передаёт studentIds для ролей кроме опекуна', () => {
		const payload = buildCreateUsersPayload({
			names: 'Учитель Ахмад',
			role: 'TEACHER',
			localStepIndex: 0,
			studentIds: ['student-1'],
		})

		expect(payload.studentIds).toBeUndefined()
	})
})

describe('createUsersSchema parent studentIds', () => {
	it('принимает опекуна без учеников', () => {
		const parsed = createUsersSchema.parse({
			entries: [{ name: 'Ибрагимова Амина' }],
			role: 'PARENT',
			phone: '89990001122',
		})

		expect(parsed.studentIds).toBeUndefined()
	})

	it('принимает studentIds для одного опекуна', () => {
		const parsed = createUsersSchema.parse({
			entries: [{ name: 'Ибрагимова Амина' }],
			role: 'PARENT',
			studentIds: ['student-1', 'student-2'],
		})

		expect(parsed.studentIds).toEqual(['student-1', 'student-2'])
	})
})
