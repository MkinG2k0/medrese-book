import { describe, expect, it } from 'vitest'

import { buildCreateUsersPayload } from '@/shared/lib/validations/user'

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
})
