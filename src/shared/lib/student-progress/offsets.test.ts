import { beforeEach, describe, expect, it, vi } from 'vitest'

const levelFindManyMock = vi.fn()

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		level: {
			findMany: (...args: unknown[]) => levelFindManyMock(...args),
		},
	},
}))

describe('offsets', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.resetModules()
	})

	it('returns different cumulative maps per subject when step counts differ', async () => {
		levelFindManyMock.mockImplementation(({ where }: { where: { subjectId: string } }) => {
			if (where.subjectId === 'sub-a') {
				return Promise.resolve([
					{ number: 1, _count: { steps: 3 } },
					{ number: 2, _count: { steps: 2 } },
				])
			}
			return Promise.resolve([
				{ number: 1, _count: { steps: 1 } },
				{ number: 2, _count: { steps: 1 } },
			])
		})

		const { getLevelStepOffsets, invalidateStepOffsetCache } = await import(
			'./offsets'
		)
		invalidateStepOffsetCache()

		const offsetsA = await getLevelStepOffsets('sub-a')
		const offsetsB = await getLevelStepOffsets('sub-b')

		expect(offsetsA.get(1)).toBe(0)
		expect(offsetsA.get(2)).toBe(3)
		expect(offsetsB.get(1)).toBe(0)
		expect(offsetsB.get(2)).toBe(1)
		expect(offsetsA).not.toEqual(offsetsB)
	})

	it('returns correct offset for level number within subject', async () => {
		levelFindManyMock.mockResolvedValue([
			{ number: 1, _count: { steps: 4 } },
			{ number: 2, _count: { steps: 5 } },
			{ number: 3, _count: { steps: 2 } },
		])

		const {
			getStepOffsetForLevel,
			toGlobalStepNumber,
			invalidateStepOffsetCache,
		} = await import('./offsets')
		invalidateStepOffsetCache()

		const offsetLevel2 = await getStepOffsetForLevel(2, 'sub-quran')
		expect(offsetLevel2).toBe(4)
		expect(toGlobalStepNumber(offsetLevel2, 3)).toBe(7)
	})

	it('filters levels by subjectId in prisma query', async () => {
		levelFindManyMock.mockResolvedValue([])

		const { getLevelStepOffsets, invalidateStepOffsetCache } = await import(
			'./offsets'
		)
		invalidateStepOffsetCache()
		await getLevelStepOffsets('sub-tajweed')

		expect(levelFindManyMock).toHaveBeenCalledWith({
			where: { subjectId: 'sub-tajweed' },
			select: { number: true, _count: { select: { steps: true } } },
			orderBy: { number: 'asc' },
		})
	})
})
