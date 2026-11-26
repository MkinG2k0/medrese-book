import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Session } from 'next-auth'

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		user: { findUnique: vi.fn() },
	},
}))

vi.mock('@/shared/lib/substitution-access', () => ({
	getActiveSubstitutionsForSubstitute: vi.fn(),
	canSubstituteAccessGroup: vi.fn(),
}))

import { prisma } from '@/shared/lib/prisma'
import {
	canSubstituteAccessGroup,
	getActiveSubstitutionsForSubstitute,
} from '@/shared/lib/substitution-access'

import { resolveSwitchAccess } from './resolve-switch-access'

function session(partial: {
	id: string
	role: string
	teacherId?: string | null
	switchOwnerId?: string | null
}): Session {
	return {
		user: {
			id: partial.id,
			name: 'Test',
			role: partial.role,
			teacherId: partial.teacherId ?? null,
			studentId: null,
			switchOwnerId: partial.switchOwnerId ?? null,
		},
		expires: '2099-01-01',
	} as Session
}

describe('resolveSwitchAccess', () => {
	beforeEach(() => {
		vi.mocked(prisma.user.findUnique).mockReset()
		vi.mocked(getActiveSubstitutionsForSubstitute).mockReset()
		vi.mocked(canSubstituteAccessGroup).mockReset()
	})

	it('сохраняет переключение для CASHIER с switchOwnerId SUPER_ADMIN', async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			role: 'SUPER_ADMIN',
		} as never)

		const result = await resolveSwitchAccess(
			session({
				id: 'cashier-1',
				role: 'CASHIER',
				switchOwnerId: 'admin-1',
			}),
		)

		expect(result).toEqual({
			allowed: true,
			switchOwnerId: 'admin-1',
		})
	})

	it('сохраняет права privileged owner под ролью TEACHER', async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			role: 'MANAGER',
		} as never)

		const result = await resolveSwitchAccess(
			session({
				id: 'teacher-1',
				role: 'TEACHER',
				teacherId: 't-1',
				switchOwnerId: 'manager-1',
			}),
		)

		expect(result).toEqual({
			allowed: true,
			switchOwnerId: 'manager-1',
		})
		expect(canSubstituteAccessGroup).not.toHaveBeenCalled()
	})

	it('запрещает CASHIER без switchOwnerId', async () => {
		const result = await resolveSwitchAccess(
			session({ id: 'cashier-1', role: 'CASHIER' }),
		)

		expect(result).toEqual({ allowed: false, switchOwnerId: null })
	})

	it('разрешает SUPER_ADMIN как владельца переключения', async () => {
		const result = await resolveSwitchAccess(
			session({ id: 'admin-1', role: 'SUPER_ADMIN' }),
		)

		expect(result).toEqual({
			allowed: true,
			switchOwnerId: 'admin-1',
		})
	})

	it('разрешает ACCOUNTANT как владельца переключения', async () => {
		const result = await resolveSwitchAccess(
			session({ id: 'acc-1', role: 'ACCOUNTANT' }),
		)

		expect(result).toEqual({
			allowed: true,
			switchOwnerId: 'acc-1',
		})
	})

	it('разрешает TEACHER с активным замещением без switchOwnerId', async () => {
		vi.mocked(getActiveSubstitutionsForSubstitute).mockResolvedValue([
			{ id: 'sub-1' },
		] as never)

		const result = await resolveSwitchAccess(
			session({
				id: 'sub-user',
				role: 'TEACHER',
				teacherId: 'sub-teacher',
			}),
		)

		expect(result).toEqual({
			allowed: true,
			switchOwnerId: 'sub-user',
		})
		expect(getActiveSubstitutionsForSubstitute).toHaveBeenCalledWith(
			'sub-teacher',
		)
	})

	it('разрешает TEACHER со switchOwnerId замещающего при валидной связи', async () => {
		vi.mocked(prisma.user.findUnique).mockImplementation(async (args) => {
			const id = (args as { where: { id: string } }).where.id
			if (id === 'sub-user') {
				return { role: 'TEACHER', teacher: { id: 'sub-teacher' } } as never
			}
			return { role: 'TEACHER' } as never
		})
		vi.mocked(canSubstituteAccessGroup).mockResolvedValue(true)

		const result = await resolveSwitchAccess(
			session({
				id: 'absent-user',
				role: 'TEACHER',
				teacherId: 'absent-teacher',
				switchOwnerId: 'sub-user',
			}),
		)

		expect(result).toEqual({
			allowed: true,
			switchOwnerId: 'sub-user',
		})
		expect(canSubstituteAccessGroup).toHaveBeenCalledWith(
			'sub-teacher',
			'absent-teacher',
		)
	})

	it('запрещает TEACHER с невалидным switchOwnerId без связи замещения', async () => {
		vi.mocked(prisma.user.findUnique).mockImplementation(async (args) => {
			const id = (args as { where: { id: string } }).where.id
			if (id === 'other-user') {
				return { role: 'TEACHER', teacher: { id: 'other-teacher' } } as never
			}
			return { role: 'TEACHER' } as never
		})
		vi.mocked(canSubstituteAccessGroup).mockResolvedValue(false)

		const result = await resolveSwitchAccess(
			session({
				id: 'teacher-1',
				role: 'TEACHER',
				teacherId: 't-1',
				switchOwnerId: 'other-user',
			}),
		)

		expect(result).toEqual({ allowed: false, switchOwnerId: null })
	})

	it('запрещает обычного TEACHER без замещения', async () => {
		vi.mocked(getActiveSubstitutionsForSubstitute).mockResolvedValue([])

		const result = await resolveSwitchAccess(
			session({
				id: 'teacher-1',
				role: 'TEACHER',
				teacherId: 't-1',
			}),
		)

		expect(result).toEqual({ allowed: false, switchOwnerId: null })
	})

	it('запрещает STUDENT и PARENT', async () => {
		await expect(
			resolveSwitchAccess(session({ id: 's-1', role: 'STUDENT' })),
		).resolves.toEqual({ allowed: false, switchOwnerId: null })

		await expect(
			resolveSwitchAccess(session({ id: 'p-1', role: 'PARENT' })),
		).resolves.toEqual({ allowed: false, switchOwnerId: null })
	})
})
