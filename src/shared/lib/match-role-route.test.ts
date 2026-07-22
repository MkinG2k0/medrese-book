import { describe, expect, it } from 'vitest'

import { matchRoleRouteAccess } from '@/shared/lib/match-role-route'

describe('matchRoleRouteAccess', () => {
	it('TEACHER на /accounting/my-salary → allow (длинный префикс, без fall-through)', () => {
		expect(matchRoleRouteAccess('/accounting/my-salary', 'TEACHER')).toBe(
			'allow',
		)
	})

	it('TEACHER на /accounting → deny', () => {
		expect(matchRoleRouteAccess('/accounting', 'TEACHER')).toBe('deny')
	})

	it('ACCOUNTANT на /accounting → allow', () => {
		expect(matchRoleRouteAccess('/accounting', 'ACCOUNTANT')).toBe('allow')
	})

	it('ACCOUNTANT на /accounting/my-salary → deny', () => {
		expect(matchRoleRouteAccess('/accounting/my-salary', 'ACCOUNTANT')).toBe(
			'deny',
		)
	})

	it('без совпадения префикса → none', () => {
		expect(matchRoleRouteAccess('/settings', 'TEACHER')).toBe('none')
	})

	it('защищённый префикс без роли → login', () => {
		expect(matchRoleRouteAccess('/accounting/my-salary', undefined)).toBe(
			'login',
		)
	})
})
