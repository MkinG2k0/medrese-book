import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRoleMock = vi.fn()
const groupFindUniqueMock = vi.fn()
const groupFindFirstMock = vi.fn()
const groupFindManyMock = vi.fn()
const groupEnrollmentFindUniqueMock = vi.fn()
const groupEnrollmentFindManyMock = vi.fn()
const levelFindFirstMock = vi.fn()
const stepFindManyMock = vi.fn()
const getTotalProgramStepsMock = vi.fn()
const loadStudentMetricsForMonthMock = vi.fn()
const findEnrollmentInGroupMock = vi.fn()
const revalidatePathMock = vi.fn()
const studentUpdateMock = vi.fn()

vi.mock('@/shared/lib/session', () => ({
	requireRole: (...args: unknown[]) => requireRoleMock(...args),
}))

vi.mock('next/cache', () => ({
	revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

vi.mock('@/shared/lib/student-progress', () => ({
	getTotalProgramSteps: (...args: unknown[]) =>
		getTotalProgramStepsMock(...args),
}))

vi.mock('@/shared/lib/student-metrics/load-student-metrics', () => ({
	loadStudentMetricsForMonth: (...args: unknown[]) =>
		loadStudentMetricsForMonthMock(...args),
}))

vi.mock('@/shared/lib/enrollment', () => ({
	findEnrollmentInGroup: (...args: unknown[]) =>
		findEnrollmentInGroupMock(...args),
	findPrimaryEnrollment: vi.fn(),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		group: {
			findUnique: (...args: unknown[]) => groupFindUniqueMock(...args),
			findFirst: (...args: unknown[]) => groupFindFirstMock(...args),
			findMany: (...args: unknown[]) => groupFindManyMock(...args),
		},
		groupEnrollment: {
			findUnique: (...args: unknown[]) => groupEnrollmentFindUniqueMock(...args),
			findMany: (...args: unknown[]) => groupEnrollmentFindManyMock(...args),
		},
		level: {
			findFirst: (...args: unknown[]) => levelFindFirstMock(...args),
		},
		step: {
			findMany: (...args: unknown[]) => stepFindManyMock(...args),
		},
		student: {
			update: (...args: unknown[]) => studentUpdateMock(...args),
		},
	},
}))

const teacherSession = {
	user: { teacherId: 'teacher-1', role: 'TEACHER' },
}

function buildEnrollment(overrides: Record<string, unknown> = {}) {
	return {
		studentId: 'student-1',
		groupId: 'group-1',
		currentStepIdx: 0,
		group: {
			subjectId: 'subject-1',
			name: 'Группа А',
			subject: { name: 'Коран' },
		},
		level: {
			number: 1,
			title: 'Уровень 1',
			steps: [
				{
					id: 'step-1',
					order: 1,
					title: 'Шаг 1',
					description: '',
					hours: 1,
				},
			],
		},
		student: {
			id: 'student-1',
			status: 'ACTIVE',
			user: { name: 'Иван' },
			completions: [],
			sessions: [],
		},
		...overrides,
	}
}

describe('journal-actions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		requireRoleMock.mockResolvedValue(teacherSession)
		getTotalProgramStepsMock.mockResolvedValue(10)
		loadStudentMetricsForMonthMock.mockResolvedValue(null)
		levelFindFirstMock.mockResolvedValue(null)
		groupEnrollmentFindManyMock.mockResolvedValue([
			{
				student: {
					id: 'student-1',
					status: 'ACTIVE',
					user: { name: 'Иван' },
				},
			},
		])
		stepFindManyMock.mockResolvedValue([])
	})

	describe('getStudentLesson', () => {
		it('возвращает null при чужом groupId (T-13-05)', async () => {
			groupFindUniqueMock.mockResolvedValue(null)

			const { getStudentLesson } = await import('./journal-actions')
			const result = await getStudentLesson(
				'student-1',
				'2026-07-12',
				'foreign-group',
			)

			expect(result).toBeNull()
			expect(groupFindUniqueMock).toHaveBeenCalledWith({
				where: { id: 'foreign-group', teacherId: 'teacher-1' },
			})
			expect(groupEnrollmentFindUniqueMock).not.toHaveBeenCalled()
		})

		it('возвращает урок с groupId, groupName и subjectName при валидном enrollment', async () => {
			groupFindUniqueMock.mockResolvedValue({
				id: 'group-1',
				teacherId: 'teacher-1',
			})
			groupEnrollmentFindUniqueMock.mockResolvedValue(buildEnrollment())

			const { getStudentLesson } = await import('./journal-actions')
			const result = await getStudentLesson(
				'student-1',
				'2026-07-12',
				'group-1',
			)

			expect(result).not.toBeNull()
			expect(result?.groupId).toBe('group-1')
			expect(result?.groupName).toBe('Группа А')
			expect(result?.subjectName).toBe('Коран')
		})

		it('groupEnrollments scoped к переданному groupId, не findFirst', async () => {
			groupFindUniqueMock.mockResolvedValue({
				id: 'group-1',
				teacherId: 'teacher-1',
			})
			groupEnrollmentFindUniqueMock.mockResolvedValue(buildEnrollment())

			const { getStudentLesson } = await import('./journal-actions')
			await getStudentLesson('student-1', '2026-07-12', 'group-1')

			expect(groupEnrollmentFindManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { groupId: 'group-1' },
				}),
			)
			expect(groupFindFirstMock).not.toHaveBeenCalled()
		})

		it('возвращает null при teacherId mismatch (assertTeacherOwnsGroup)', async () => {
			groupFindUniqueMock.mockResolvedValue(null)

			const { getStudentLesson } = await import('./journal-actions')
			const result = await getStudentLesson(
				'student-1',
				'2026-07-12',
				'group-other-teacher',
			)

			expect(result).toBeNull()
		})
	})
})
