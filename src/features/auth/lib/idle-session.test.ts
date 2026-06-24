import { describe, expect, it } from 'vitest'

import {
	isTeacherIdleLogoutEnabled,
	TEACHER_IDLE_TIMEOUT_MS,
} from './idle-session'

describe('idle-session', () => {
	it('включает idle logout только для учителя', () => {
		expect(isTeacherIdleLogoutEnabled('TEACHER')).toBe(true)
		expect(isTeacherIdleLogoutEnabled('MANAGER')).toBe(false)
		expect(isTeacherIdleLogoutEnabled('SUPER_ADMIN')).toBe(false)
		expect(isTeacherIdleLogoutEnabled('STUDENT')).toBe(false)
	})

	it('таймаут равен 1 часу', () => {
		expect(TEACHER_IDLE_TIMEOUT_MS).toBe(60 * 60 * 1000)
	})
})
