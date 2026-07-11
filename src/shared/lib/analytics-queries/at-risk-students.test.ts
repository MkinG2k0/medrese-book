import { beforeEach, describe, expect, it, vi } from 'vitest'

const studentFindManyMock = vi.fn()
const loadStudentMetricsForMonthMock = vi.fn()

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		student: {
			findMany: (...args: unknown[]) => studentFindManyMock(...args),
		},
	},
}))

vi.mock('@/shared/lib/student-metrics/load-student-metrics', () => ({
	loadStudentMetricsForMonth: (...args: unknown[]) =>
		loadStudentMetricsForMonthMock(...args),
}))

describe('getAtRiskStudents', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		studentFindManyMock.mockResolvedValue([])
		loadStudentMetricsForMonthMock.mockResolvedValue(null)
	})

	it('filters students by group.subjectId', async () => {
		const { getAtRiskStudents } = await import('./at-risk-students')
		const month = new Date('2026-07-01T00:00:00.000Z')

		await getAtRiskStudents(month, null, null, 'subject-quran')

		expect(studentFindManyMock).toHaveBeenCalledOnce()
		const args = studentFindManyMock.mock.calls[0]![0] as {
			where: { enrollments: { some: { group: Record<string, unknown> } } }
		}
		expect(args.where.enrollments.some.group).toMatchObject({
			subjectId: 'subject-quran',
		})
	})

	it('passes subject scope into loadStudentMetricsForMonth', async () => {
		studentFindManyMock.mockResolvedValue([
			{ id: 'student-1', user: { name: 'Али' } },
		])
		loadStudentMetricsForMonthMock.mockResolvedValue({
			teacherName: 'Учитель',
			levelTitle: 'Уровень 1',
			riskFlags: ['ATTENDANCE'],
			absencesInMonth: 2,
			timeNorm: { actualMinutes: 30, budgetMinutes: 60 },
		})

		const { getAtRiskStudents } = await import('./at-risk-students')
		const month = new Date('2026-07-01T00:00:00.000Z')
		await getAtRiskStudents(month, 'teacher-1', 'group-1', 'subject-quran')

		expect(loadStudentMetricsForMonthMock).toHaveBeenCalledWith(
			'student-1',
			month,
			expect.any(String),
			{ subjectId: 'subject-quran', groupId: 'group-1' },
		)
	})
})
