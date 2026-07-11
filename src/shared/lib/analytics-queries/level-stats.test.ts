import { beforeEach, describe, expect, it, vi } from 'vitest'

const levelFindManyMock = vi.fn()

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		level: {
			findMany: (...args: unknown[]) => levelFindManyMock(...args),
		},
	},
}))

describe('getLevelStats', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		levelFindManyMock.mockResolvedValue([
			{
				id: 'level-1',
				number: 3,
				subjectId: 'subject-quran',
				subject: { name: 'Коран' },
				steps: [{ hours: 2 }],
				enrollments: [],
			},
		])
	})

	it('queries levels filtered by subjectId', async () => {
		const { getLevelStats } = await import('./level-stats')
		const month = new Date('2026-07-01T00:00:00.000Z')

		await getLevelStats(month, null, null, 'subject-quran')

		expect(levelFindManyMock).toHaveBeenCalledOnce()
		const args = levelFindManyMock.mock.calls[0]![0] as {
			where: { subjectId: string }
		}
		expect(args.where).toEqual({ subjectId: 'subject-quran' })
	})

	it('uses level number as label without subject suffix', async () => {
		const { getLevelStats } = await import('./level-stats')
		const month = new Date('2026-07-01T00:00:00.000Z')
		const result = await getLevelStats(month, null, null, 'subject-quran')

		expect(result[0]?.label).toBe('3')
		expect(result[0]?.label).not.toContain('(')
	})
})
