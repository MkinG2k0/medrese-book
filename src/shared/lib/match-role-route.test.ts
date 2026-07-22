import { describe, expect, it } from 'vitest'

import { matchRoleRouteAccess } from '@/shared/lib/match-role-route'

describe('matchRoleRouteAccess', () => {
	describe('accounting nested prefixes', () => {
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
			expect(
				matchRoleRouteAccess('/accounting/my-salary', 'ACCOUNTANT'),
			).toBe('deny')
		})
	})

	describe('analytics nested prefixes', () => {
		it('TEACHER на /analytics → allow', () => {
			expect(matchRoleRouteAccess('/analytics', 'TEACHER')).toBe('allow')
		})

		it('TEACHER на /analytics/teachers → deny', () => {
			expect(matchRoleRouteAccess('/analytics/teachers', 'TEACHER')).toBe(
				'deny',
			)
		})

		it('MANAGER на /analytics/teachers → allow', () => {
			expect(matchRoleRouteAccess('/analytics/teachers', 'MANAGER')).toBe(
				'allow',
			)
		})

		it('TEACHER на /analytics/my-hours → allow', () => {
			expect(matchRoleRouteAccess('/analytics/my-hours', 'TEACHER')).toBe(
				'allow',
			)
		})

		it('MANAGER на /analytics/my-hours → deny', () => {
			expect(matchRoleRouteAccess('/analytics/my-hours', 'MANAGER')).toBe(
				'deny',
			)
		})
	})

	describe('student routes', () => {
		it('STUDENT на /student/me → allow', () => {
			expect(matchRoleRouteAccess('/student/me', 'STUDENT')).toBe('allow')
		})

		it('TEACHER на /student/me → deny', () => {
			expect(matchRoleRouteAccess('/student/me', 'TEACHER')).toBe('deny')
		})
	})

	describe('session and unmatched', () => {
		it('защищённый префикс без роли → login', () => {
			expect(matchRoleRouteAccess('/accounting/my-salary', undefined)).toBe(
				'login',
			)
		})

		it('без совпадения префикса → none', () => {
			expect(matchRoleRouteAccess('/settings', 'TEACHER')).toBe('none')
		})
	})
})
