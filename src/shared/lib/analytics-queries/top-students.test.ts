import { beforeEach, describe, expect, it, vi } from 'vitest'

const studentFindManyMock = vi.fn()

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		student: {
			findMany: (...args: unknown[]) => studentFindManyMock(...args),
		},
	},
}))

describe('getTopStudents', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		studentFindManyMock.mockResolvedValue([])
	})

	it('filters students and sessions by group.subjectId', async () => {
		const { getTopStudents } = await import('./top-students')
		const month = new Date('2026-07-01T00:00:00.000Z')

		await getTopStudents(month, null, null, 'subject-quran')

		expect(studentFindManyMock).toHaveBeenCalledOnce()
		const args = studentFindManyMock.mock.calls[0]![0] as {
			where: { enrollments: { some: { group: Record<string, unknown> } } }
			include: {
				completions: { where: { session: { group: Record<string, unknown> } } }
				sessions: { where: { group: Record<string, unknown> } }
			}
		}

		expect(args.where.enrollments.some.group).toMatchObject({
			subjectId: 'subject-quran',
		})
		expect(args.include.completions.where.session.group).toMatchObject({
			subjectId: 'subject-quran',
		})
		expect(args.include.sessions.where.group).toMatchObject({
			subjectId: 'subject-quran',
		})
	})

	it('aggregates metrics into one row per student', async () => {
		studentFindManyMock.mockResolvedValue([
			{
				id: 'student-1',
				user: { name: 'Али' },
				completions: [
					{ grade: 5 },
					{ grade: 4 },
				],
				sessions: [
					{ attendance: 'PRESENT', lateMinutes: null },
					{ attendance: 'ABSENT', lateMinutes: null },
					{ attendance: 'LATE', lateMinutes: 10 },
				],
			},
		])

		const { getTopStudents } = await import('./top-students')
		const month = new Date('2026-07-01T00:00:00.000Z')
		const result = await getTopStudents(month, null, null, 'subject-quran')

		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			student: { id: 'student-1', name: 'Али' },
			stepsCompleted: 2,
			avgGrade: 4.5,
			absences: 1,
			lateMinutes: 10,
			attendedSessions: 2,
		})
	})
})
