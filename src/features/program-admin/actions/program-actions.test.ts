import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRolesMock = vi.fn()
const levelFindManyMock = vi.fn()
const levelFindFirstMock = vi.fn()
const levelFindUniqueMock = vi.fn()
const levelFindUniqueOrThrowMock = vi.fn()
const levelCreateMock = vi.fn()
const levelUpdateMock = vi.fn()
const levelDeleteMock = vi.fn()
const subjectFindUniqueMock = vi.fn()
const studentCountMock = vi.fn()
const stepFindUniqueMock = vi.fn()
const stepFindUniqueOrThrowMock = vi.fn()
const stepCreateMock = vi.fn()
const stepUpdateMock = vi.fn()
const stepDeleteMock = vi.fn()
const stepFindManyMock = vi.fn()
const stepAggregateMock = vi.fn()
const transactionMock = vi.fn()
const revalidatePathMock = vi.fn()
const invalidateStepOffsetCacheMock = vi.fn()

vi.mock('@/shared/lib/session', () => ({
	requireRoles: (...args: unknown[]) => requireRolesMock(...args),
}))

vi.mock('next/cache', () => ({
	revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

vi.mock('@/shared/lib/student-progress', () => ({
	invalidateStepOffsetCache: (...args: unknown[]) =>
		invalidateStepOffsetCacheMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		level: {
			findMany: (...args: unknown[]) => levelFindManyMock(...args),
			findFirst: (...args: unknown[]) => levelFindFirstMock(...args),
			findUnique: (...args: unknown[]) => levelFindUniqueMock(...args),
			findUniqueOrThrow: (...args: unknown[]) =>
				levelFindUniqueOrThrowMock(...args),
			create: (...args: unknown[]) => levelCreateMock(...args),
			update: (...args: unknown[]) => levelUpdateMock(...args),
			delete: (...args: unknown[]) => levelDeleteMock(...args),
		},
		subject: {
			findUnique: (...args: unknown[]) => subjectFindUniqueMock(...args),
		},
		student: {
			count: (...args: unknown[]) => studentCountMock(...args),
		},
		step: {
			findUnique: (...args: unknown[]) => stepFindUniqueMock(...args),
			findUniqueOrThrow: (...args: unknown[]) =>
				stepFindUniqueOrThrowMock(...args),
			findMany: (...args: unknown[]) => stepFindManyMock(...args),
			aggregate: (...args: unknown[]) => stepAggregateMock(...args),
			create: (...args: unknown[]) => stepCreateMock(...args),
			update: (...args: unknown[]) => stepUpdateMock(...args),
			delete: (...args: unknown[]) => stepDeleteMock(...args),
		},
		$transaction: (...args: unknown[]) => transactionMock(...args),
	},
}))

describe('program-actions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		requireRolesMock.mockResolvedValue({ user: { role: 'MANAGER' } })
	})

	describe('getLevels', () => {
		it('returns only levels for the given subjectId', async () => {
			levelFindManyMock.mockResolvedValue([
				{ id: 'lvl-1', subjectId: 'sub-a', number: 1, title: 'Уровень 1' },
			])

			const { getLevels } = await import('./program-actions')
			const result = await getLevels('sub-a')

			expect(requireRolesMock).toHaveBeenCalledWith(['SUPER_ADMIN', 'MANAGER'])
			expect(levelFindManyMock).toHaveBeenCalledWith({
				where: { subjectId: 'sub-a' },
				include: { _count: { select: { steps: true } } },
				orderBy: { number: 'asc' },
			})
			expect(result).toHaveLength(1)
			expect(result[0]?.subjectId).toBe('sub-a')
		})
	})

	describe('getLevelSteps', () => {
		it('returns null when level belongs to a different subject', async () => {
			levelFindFirstMock.mockResolvedValue(null)

			const { getLevelSteps } = await import('./program-actions')
			const result = await getLevelSteps('sub-a', 'lvl-other')

			expect(levelFindFirstMock).toHaveBeenCalledWith({
				where: { id: 'lvl-other', subjectId: 'sub-a' },
				include: { steps: { orderBy: { order: 'asc' } } },
			})
			expect(result).toBeNull()
		})

		it('returns level with steps when subject matches', async () => {
			levelFindFirstMock.mockResolvedValue({
				id: 'lvl-1',
				subjectId: 'sub-a',
				steps: [{ id: 'step-1', order: 1 }],
			})

			const { getLevelSteps } = await import('./program-actions')
			const result = await getLevelSteps('sub-a', 'lvl-1')

			expect(result?.steps).toHaveLength(1)
		})
	})

	describe('deleteLevel', () => {
		it('rejects when student count is greater than zero', async () => {
			levelFindFirstMock.mockResolvedValue({
				id: 'lvl-1',
				subjectId: 'sub-a',
			})
			studentCountMock.mockResolvedValue(3)

			const { deleteLevel } = await import('./program-actions')

			await expect(deleteLevel('sub-a', 'lvl-1')).rejects.toThrow(
				'Нельзя удалить уровень с учениками',
			)
			expect(levelDeleteMock).not.toHaveBeenCalled()
		})

		it('deletes level when there are no students', async () => {
			levelFindFirstMock.mockResolvedValue({
				id: 'lvl-1',
				subjectId: 'sub-a',
			})
			studentCountMock.mockResolvedValue(0)
			levelDeleteMock.mockResolvedValue({ id: 'lvl-1' })

			const { deleteLevel } = await import('./program-actions')
			await deleteLevel('sub-a', 'lvl-1')

			expect(levelDeleteMock).toHaveBeenCalledWith({ where: { id: 'lvl-1' } })
			expect(invalidateStepOffsetCacheMock).toHaveBeenCalledWith('sub-a')
			expect(revalidatePathMock).toHaveBeenCalledWith(
				'/admin/subjects/sub-a/program',
			)
			expect(revalidatePathMock).toHaveBeenCalledWith('/admin/subjects')
		})
	})
})
