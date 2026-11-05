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

		it('CASHIER на /accounting/payments → allow', () => {
			expect(matchRoleRouteAccess('/accounting/payments', 'CASHIER')).toBe(
				'allow',
			)
		})

		it('CASHIER на /accounting/payment-requests → allow', () => {
			expect(
				matchRoleRouteAccess('/accounting/payment-requests', 'CASHIER'),
			).toBe('allow')
		})

		it('CASHIER на /accounting → deny (без fall-through с payments)', () => {
			expect(matchRoleRouteAccess('/accounting', 'CASHIER')).toBe('deny')
		})

		it('CASHIER на /accounting/salaries → deny', () => {
			expect(matchRoleRouteAccess('/accounting/salaries', 'CASHIER')).toBe(
				'deny',
			)
		})

		it('CASHIER на /accounting/expenses → deny', () => {
			expect(matchRoleRouteAccess('/accounting/expenses', 'CASHIER')).toBe(
				'deny',
			)
		})

		it('CASHIER на /accounting/ledger → deny', () => {
			expect(matchRoleRouteAccess('/accounting/ledger', 'CASHIER')).toBe(
				'deny',
			)
		})

		it('CASHIER на /accounting/my-salary → deny', () => {
			expect(matchRoleRouteAccess('/accounting/my-salary', 'CASHIER')).toBe(
				'deny',
			)
		})

		it('ACCOUNTANT на /accounting/payments → allow', () => {
			expect(
				matchRoleRouteAccess('/accounting/payments', 'ACCOUNTANT'),
			).toBe('allow')
		})

		it('ACCOUNTANT на /accounting/payment-requests → allow', () => {
			expect(
				matchRoleRouteAccess('/accounting/payment-requests', 'ACCOUNTANT'),
			).toBe('allow')
		})

		it('CASHIER на /accounting/debts → allow', () => {
			expect(matchRoleRouteAccess('/accounting/debts', 'CASHIER')).toBe(
				'allow',
			)
		})

		it('CASHIER на /accounting/debts/ → allow', () => {
			expect(matchRoleRouteAccess('/accounting/debts/', 'CASHIER')).toBe(
				'allow',
			)
		})

		it('ACCOUNTANT на /accounting/debts → allow', () => {
			expect(matchRoleRouteAccess('/accounting/debts', 'ACCOUNTANT')).toBe(
				'allow',
			)
		})

		it('TEACHER на /accounting/debts → deny', () => {
			expect(matchRoleRouteAccess('/accounting/debts', 'TEACHER')).toBe(
				'deny',
			)
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

	describe('parent routes', () => {
		it('PARENT на /parent/me → allow', () => {
			expect(matchRoleRouteAccess('/parent/me', 'PARENT')).toBe('allow')
		})

		it('PARENT на /parent/pay → allow', () => {
			expect(matchRoleRouteAccess('/parent/pay', 'PARENT')).toBe('allow')
		})

		it('STUDENT на /parent/me → deny', () => {
			expect(matchRoleRouteAccess('/parent/me', 'STUDENT')).toBe('deny')
		})
	})

	describe('help route', () => {
		it('TEACHER на /help → allow', () => {
			expect(matchRoleRouteAccess('/help', 'TEACHER')).toBe('allow')
		})

		it('MANAGER на /help → allow', () => {
			expect(matchRoleRouteAccess('/help', 'MANAGER')).toBe('allow')
		})

		it('STUDENT на /help → deny', () => {
			expect(matchRoleRouteAccess('/help', 'STUDENT')).toBe('deny')
		})

		it('/help без роли → login', () => {
			expect(matchRoleRouteAccess('/help', undefined)).toBe('login')
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

	describe('messages route', () => {
		it('ACCOUNTANT на /messages → allow', () => {
			expect(matchRoleRouteAccess('/messages', 'ACCOUNTANT')).toBe('allow')
		})

		it('PARENT на /messages → allow', () => {
			expect(matchRoleRouteAccess('/messages', 'PARENT')).toBe('allow')
		})

		it('SUPER_ADMIN на /messages → deny', () => {
			expect(matchRoleRouteAccess('/messages', 'SUPER_ADMIN')).toBe('deny')
		})
	})
})
