import { beforeEach, describe, expect, it, vi } from 'vitest'

const sessionFindFirstMock = vi.fn()
const sessionCreateMock = vi.fn()
const stepCompletionDeleteManyMock = vi.fn()
const stepCompletionFindManyMock = vi.fn()
const stepCompletionUpdateMock = vi.fn()
const stepCompletionCreateMock = vi.fn()

vi.mock('@/shared/lib/calendar-date', () => ({
	getLocalDateString: () => '2026-07-11',
	getCalendarDayQueryRange: () => ({
		start: new Date('2026-07-11T00:00:00.000Z'),
		end: new Date('2026-07-11T23:59:59.999Z'),
	}),
	toSessionDate: (date: string) => new Date(`${date}T12:00:00.000Z`),
}))

const tx = {
	session: {
		findFirst: (...args: unknown[]) => sessionFindFirstMock(...args),
		create: (...args: unknown[]) => sessionCreateMock(...args),
	},
	stepCompletion: {
		deleteMany: (...args: unknown[]) => stepCompletionDeleteManyMock(...args),
		findMany: (...args: unknown[]) => stepCompletionFindManyMock(...args),
		update: (...args: unknown[]) => stepCompletionUpdateMock(...args),
		create: (...args: unknown[]) => stepCompletionCreateMock(...args),
	},
}

const studentId = 'student-1'
const levelSteps = [{ id: 'step-1' }, { id: 'step-2' }, { id: 'step-3' }]

describe('syncCompletionsForProgress', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		stepCompletionFindManyMock.mockResolvedValue([])
		stepCompletionDeleteManyMock.mockResolvedValue({ count: 0 })
	})

	it('создаёт adjustment session с groupId', async () => {
		sessionFindFirstMock.mockResolvedValue(null)
		sessionCreateMock.mockResolvedValue({
			id: 'session-1',
			studentId,
			groupId: 'group-a',
		})

		const { syncCompletionsForProgress } = await import('./sync-for-progress')
		await syncCompletionsForProgress(
			tx as never,
			studentId,
			'group-a',
			levelSteps,
			1,
		)

		expect(sessionFindFirstMock).toHaveBeenCalledWith({
			where: {
				studentId,
				groupId: 'group-a',
				isAdjustment: true,
				date: {
					gte: new Date('2026-07-11T00:00:00.000Z'),
					lte: new Date('2026-07-11T23:59:59.999Z'),
				},
			},
		})
		expect(sessionCreateMock).toHaveBeenCalledWith({
			data: expect.objectContaining({
				studentId,
				groupId: 'group-a',
				isAdjustment: true,
				attendance: 'PRESENT',
				note: 'Корректировка прогресса',
			}),
		})
	})

	it('находит существующую adjustment той же группы в тот же день', async () => {
		const existingSession = {
			id: 'session-existing',
			studentId,
			groupId: 'group-a',
		}
		sessionFindFirstMock.mockResolvedValue(existingSession)

		const { syncCompletionsForProgress } = await import('./sync-for-progress')
		await syncCompletionsForProgress(
			tx as never,
			studentId,
			'group-a',
			levelSteps,
			1,
		)

		expect(sessionCreateMock).not.toHaveBeenCalled()
		expect(stepCompletionCreateMock).toHaveBeenCalledWith({
			data: expect.objectContaining({
				sessionId: 'session-existing',
			}),
		})
	})

	it('не смешивает adjustment разных groupId', async () => {
		sessionFindFirstMock.mockResolvedValue(null)
		sessionCreateMock.mockImplementation(({ data }: { data: { groupId: string } }) =>
			Promise.resolve({ id: `session-${data.groupId}`, ...data }),
		)

		const { syncCompletionsForProgress } = await import('./sync-for-progress')
		await syncCompletionsForProgress(
			tx as never,
			studentId,
			'group-a',
			levelSteps,
			1,
		)
		await syncCompletionsForProgress(
			tx as never,
			studentId,
			'group-b',
			levelSteps,
			1,
		)

		expect(sessionFindFirstMock).toHaveBeenNthCalledWith(1, {
			where: expect.objectContaining({ groupId: 'group-a' }),
		})
		expect(sessionFindFirstMock).toHaveBeenNthCalledWith(2, {
			where: expect.objectContaining({ groupId: 'group-b' }),
		})
		expect(sessionCreateMock).toHaveBeenCalledTimes(2)
		expect(sessionCreateMock.mock.calls[0][0].data.groupId).toBe('group-a')
		expect(sessionCreateMock.mock.calls[1][0].data.groupId).toBe('group-b')
	})
})
