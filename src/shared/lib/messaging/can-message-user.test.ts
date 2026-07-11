import { describe, expect, it, vi } from 'vitest'

import type { Session } from 'next-auth'

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		user: { findUnique: vi.fn() },
		groupEnrollment: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
		substitution: { findMany: vi.fn() },
	},
}))

vi.mock('@/shared/lib/group-access', () => ({
	canAccessGroupAsTeacher: vi.fn(),
}))

import { canAccessGroupAsTeacher } from '@/shared/lib/group-access'
import { canMessageUser } from '@/shared/lib/messaging/can-message-user'
import { prisma } from '@/shared/lib/prisma'

function session(
	overrides: Partial<Session['user']> & { id: string; role: Session['user']['role'] },
): Session {
	return {
		user: {
			name: 'Test',
			teacherId: null,
			studentId: null,
			switchOwnerId: null,
			...overrides,
		},
		expires: '',
	}
}

describe('canMessageUser', () => {
	it('запрещает супер-админу', async () => {
		const result = await canMessageUser(
			session({ id: 'sa', role: 'SUPER_ADMIN' }),
			'other',
		)
		expect(result).toBe(false)
	})

	it('менеджер может писать учителю', async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: 't1',
			role: 'TEACHER',
			teacher: { id: 'teacher-1' },
			student: null,
		} as never)

		const result = await canMessageUser(
			session({ id: 'm1', role: 'MANAGER' }),
			't1',
		)
		expect(result).toBe(true)
	})

	it('учитель может писать своему ученику', async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: 's1',
			role: 'STUDENT',
			teacher: null,
			student: { id: 'student-1' },
		} as never)
		vi.mocked(prisma.groupEnrollment.findMany).mockResolvedValue([
			{ group: { teacherId: 'teacher-1' } },
		] as never)
		vi.mocked(canAccessGroupAsTeacher).mockResolvedValue(true)

		const result = await canMessageUser(
			session({ id: 't1', role: 'TEACHER', teacherId: 'teacher-1' }),
			's1',
		)
		expect(result).toBe(true)
	})

	it('учитель может писать другому учителю', async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: 't2',
			role: 'TEACHER',
			teacher: { id: 'teacher-2' },
			student: null,
		} as never)

		const result = await canMessageUser(
			session({ id: 't1', role: 'TEACHER', teacherId: 'teacher-1' }),
			't2',
		)
		expect(result).toBe(true)
	})

	it('ученик может писать своему учителю', async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: 't1',
			role: 'TEACHER',
			teacher: { id: 'teacher-1' },
			student: null,
		} as never)
		vi.mocked(prisma.groupEnrollment.findFirst).mockResolvedValue({
			group: { teacherId: 'teacher-1' },
		} as never)

		const result = await canMessageUser(
			session({ id: 's1', role: 'STUDENT', studentId: 'student-1' }),
			't1',
		)
		expect(result).toBe(true)
	})
})
