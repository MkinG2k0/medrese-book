import { beforeEach, describe, expect, it, vi } from 'vitest'

const findEnrollmentInGroupMock = vi.fn()
const stepCompletionFindManyMock = vi.fn()
const levelFindFirstMock = vi.fn()
const groupEnrollmentUpdateMock = vi.fn()
const getStepOffsetForLevelMock = vi.fn()
const studentUpdateMock = vi.fn()

vi.mock('@/shared/lib/enrollment', () => ({
	findEnrollmentInGroup: (...args: unknown[]) =>
		findEnrollmentInGroupMock(...args),
}))

vi.mock('./offsets', () => ({
	getStepOffsetForLevel: (...args: unknown[]) =>
		getStepOffsetForLevelMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		stepCompletion: {
			findMany: (...args: unknown[]) => stepCompletionFindManyMock(...args),
		},
		level: {
			findFirst: (...args: unknown[]) => levelFindFirstMock(...args),
		},
		groupEnrollment: {
			update: (...args: unknown[]) => groupEnrollmentUpdateMock(...args),
		},
		student: {
			update: (...args: unknown[]) => studentUpdateMock(...args),
		},
	},
}))

const studentId = 'student-1'
const groupId = 'group-1'
const enrollmentId = 'enrollment-1'
const subjectId = 'subject-quran'

function makeEnrollment(overrides: {
	currentStepIdx?: number
	steps?: { id: string }[]
	levelNumber?: number
}) {
	const steps = overrides.steps ?? [
		{ id: 'step-1', order: 1 },
		{ id: 'step-2', order: 2 },
		{ id: 'step-3', order: 3 },
	]
	return {
		id: enrollmentId,
		studentId,
		groupId,
		levelId: 'level-1',
		currentStepIdx: overrides.currentStepIdx ?? 0,
		group: { subjectId },
		level: {
			id: 'level-1',
			number: overrides.levelNumber ?? 1,
			subjectId,
			steps,
		},
	}
}

describe('recalculateStudentStepIdx', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		getStepOffsetForLevelMock.mockResolvedValue(10)
	})

	it('обновляет enrollment.currentStepIdx при новых completions', async () => {
		findEnrollmentInGroupMock.mockResolvedValue(
			makeEnrollment({ currentStepIdx: 10 }),
		)
		stepCompletionFindManyMock.mockResolvedValue([
			{ stepId: 'step-1', grade: 1 },
		])

		const { recalculateStudentStepIdx } = await import('./recalculate')
		const result = await recalculateStudentStepIdx(studentId, groupId)

		expect(result).toBe(11)
		expect(getStepOffsetForLevelMock).toHaveBeenCalledWith(1, subjectId)
		expect(groupEnrollmentUpdateMock).toHaveBeenCalledWith({
			where: { id: enrollmentId },
			data: { currentStepIdx: 11 },
		})
		expect(studentUpdateMock).not.toHaveBeenCalled()
	})

	it('auto-promote меняет enrollment.levelId без side-effect на Student', async () => {
		findEnrollmentInGroupMock.mockResolvedValue(
			makeEnrollment({
				currentStepIdx: 10,
				steps: [
					{ id: 'step-1' },
					{ id: 'step-2' },
				],
			}),
		)
		stepCompletionFindManyMock.mockResolvedValue([
			{ stepId: 'step-1', grade: 1 },
			{ stepId: 'step-2', grade: 2 },
		])
		levelFindFirstMock.mockResolvedValue({ id: 'level-2', number: 2 })

		const { recalculateStudentStepIdx } = await import('./recalculate')
		const result = await recalculateStudentStepIdx(studentId, groupId)

		expect(result).toBe(12)
		expect(groupEnrollmentUpdateMock).toHaveBeenCalledTimes(1)
		expect(groupEnrollmentUpdateMock).toHaveBeenCalledWith({
			where: { id: enrollmentId },
			data: { levelId: 'level-2', currentStepIdx: 12 },
		})
		expect(levelFindFirstMock).toHaveBeenCalledWith({
			where: { number: 2, subjectId },
		})
		expect(studentUpdateMock).not.toHaveBeenCalled()
	})

	it('no-op когда enrollment не найден', async () => {
		findEnrollmentInGroupMock.mockResolvedValue(null)

		const { recalculateStudentStepIdx } = await import('./recalculate')
		const result = await recalculateStudentStepIdx(studentId, groupId)

		expect(result).toBeUndefined()
		expect(stepCompletionFindManyMock).not.toHaveBeenCalled()
		expect(groupEnrollmentUpdateMock).not.toHaveBeenCalled()
		expect(studentUpdateMock).not.toHaveBeenCalled()
	})
})
