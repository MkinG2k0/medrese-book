import { describe, expect, it } from 'vitest'

import { canSwitchUser } from './can-switch-user'

describe('canSwitchUser', () => {
	it('разрешает SUPER_ADMIN и MANAGER', () => {
		expect(canSwitchUser('SUPER_ADMIN')).toBe(true)
		expect(canSwitchUser('MANAGER')).toBe(true)
	})

	it('разрешает ACCOUNTANT как privileged роль', () => {
		expect(canSwitchUser('ACCOUNTANT')).toBe(true)
		expect(canSwitchUser('ACCOUNTANT', null)).toBe(true)
	})

	it('запрещает TEACHER без switchOwnerId', () => {
		expect(canSwitchUser('TEACHER')).toBe(false)
		expect(canSwitchUser('TEACHER', null)).toBe(false)
	})

	it('разрешает TEACHER с truthy switchOwnerId', () => {
		expect(canSwitchUser('TEACHER', 'owner-id')).toBe(true)
	})

	it('запрещает STUDENT', () => {
		expect(canSwitchUser('STUDENT')).toBe(false)
	})
})
