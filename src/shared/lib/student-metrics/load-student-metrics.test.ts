import { beforeEach, describe, expect, it, vi } from 'vitest'

const groupEnrollmentFindManyMock = vi.fn()
const studentFindUniqueMock = vi.fn()
const getStepOffsetForLevelMock = vi.fn()
const buildTeachingSessionDurationByDateMock = vi.fn()
const buildStudentRiskFlagsMock = vi.fn()

vi.mock('@/shared/lib/student-progress', () => ({
	getStepOffsetForLevel: (...args: unknown[]) => getStepOffsetForLevelMock(...args),
}))

vi.mock('@/shared/lib/teaching-session-duration-map', () => ({
	buildTeachingSessionDurationByDate: (...args: unknown[]) =>
		buildTeachingSessionDurationByDateMock(...args),
	teachingSessionDurationFromMap: vi.fn(),
}))

vi.mock('./risk-flags', () => ({
	buildStudentRiskFlags: (...args: unknown[]) => buildStudentRiskFlagsMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		groupEnrollment: {
			findMany: (...args: unknown[]) => groupEnrollmentFindManyMock(...args),
		},
		student: {
			findUnique: (...args: unknown[]) => studentFindUniqueMock(...args),
		},
	},
}))

const enrollmentTemplate = {
	levelId: 'level-1',
	currentStepIdx: 0,
	level: {
		id: 'level-1',
		number: 1,
		title: 'Уровень 1',
		steps: [{ id: 'step-1', hours: 1, order: 1 }],
	},
	group: {
		id: 'group-1',
		teacher: { user: { name: 'Учитель A' } },
	},
}

describe('loadStudentMetricsForMonth', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		getStepOffsetForLevelMock.mockResolvedValue(0)
		buildTeachingSessionDurationByDateMock.mockResolvedValue(new Map())
		buildStudentRiskFlagsMock.mockReturnValue([])
	})

	it('loads enrollments scoped by group.subjectId', async () => {
		groupEnrollmentFindManyMock.mockResolvedValue([])
		const { loadStudentMetricsForMonth } = await import('./load-student-metrics')
		const month = new Date('2026-07-01T00:00:00.000Z')

		await loadStudentMetricsForMonth('student-1', month, 'июль 2026', {
			subjectId: 'subject-quran',
		})

		expect(groupEnrollmentFindManyMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					studentId: 'student-1',
					group: { subjectId: 'subject-quran' },
				},
			}),
		)
	})

	it('filters sessions and completions by subject groupIds', async () => {
		groupEnrollmentFindManyMock.mockResolvedValue([
			{ ...enrollmentTemplate, groupId: 'group-1' },
		])
		studentFindUniqueMock.mockResolvedValue({
			id: 'student-1',
			user: { name: 'Али' },
			sessions: [],
			completions: [],
		})

		const { loadStudentMetricsForMonth } = await import('./load-student-metrics')
		const month = new Date('2026-07-01T00:00:00.000Z')

		await loadStudentMetricsForMonth('student-1', month, 'июль 2026', {
			subjectId: 'subject-quran',
		})

		expect(studentFindUniqueMock).toHaveBeenCalledWith(
			expect.objectContaining({
				include: expect.objectContaining({
					sessions: {
						where: { groupId: { in: ['group-1'] } },
						select: expect.any(Object),
					},
					completions: {
						where: { session: { groupId: { in: ['group-1'] } } },
						select: expect.any(Object),
					},
				}),
			}),
		)
	})

	it('picks worst-case enrollment when student has multiple groups in subject', async () => {
		groupEnrollmentFindManyMock.mockResolvedValue([
			{
				...enrollmentTemplate,
				groupId: 'group-1',
				group: {
					id: 'group-1',
					teacher: { user: { name: 'Учитель A' } },
				},
			},
			{
				...enrollmentTemplate,
				groupId: 'group-2',
				level: {
					...enrollmentTemplate.level,
					title: 'Уровень 2',
				},
				group: {
					id: 'group-2',
					teacher: { user: { name: 'Учитель B' } },
				},
			},
		])
		studentFindUniqueMock.mockResolvedValue({
			id: 'student-1',
			user: { name: 'Али' },
			sessions: [],
			completions: [],
		})

		let call = 0
		buildStudentRiskFlagsMock.mockImplementation(() => {
			call += 1
			return call === 1 ? (['TIME_NORM'] as const) : (['TIME_NORM', 'ATTENDANCE'] as const)
		})

		const { loadStudentMetricsForMonth } = await import('./load-student-metrics')
		const month = new Date('2026-07-01T00:00:00.000Z')
		const result = await loadStudentMetricsForMonth('student-1', month, 'июль 2026', {
			subjectId: 'subject-quran',
		})

		expect(result?.riskFlags).toEqual(['TIME_NORM', 'ATTENDANCE'])
		expect(result?.teacherName).toBe('Учитель B')
	})
})
