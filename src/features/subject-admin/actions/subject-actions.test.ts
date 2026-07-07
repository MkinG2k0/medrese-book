import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRolesMock = vi.fn()
const subjectFindManyMock = vi.fn()
const subjectFindUniqueMock = vi.fn()
const subjectCreateMock = vi.fn()
const subjectUpdateMock = vi.fn()
const subjectDeleteMock = vi.fn()
const levelCountMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock('@/shared/lib/session', () => ({
	requireRoles: (...args: unknown[]) => requireRolesMock(...args),
}))

vi.mock('next/cache', () => ({
	revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		subject: {
			findMany: (...args: unknown[]) => subjectFindManyMock(...args),
			findUnique: (...args: unknown[]) => subjectFindUniqueMock(...args),
			create: (...args: unknown[]) => subjectCreateMock(...args),
			update: (...args: unknown[]) => subjectUpdateMock(...args),
			delete: (...args: unknown[]) => subjectDeleteMock(...args),
		},
		level: {
			count: (...args: unknown[]) => levelCountMock(...args),
		},
	},
}))

describe('subject-actions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		requireRolesMock.mockResolvedValue({ user: { role: 'MANAGER' } })
	})

	describe('getSubjects', () => {
		it('returns subjects ordered by name with level counts', async () => {
			subjectFindManyMock.mockResolvedValue([
				{
					id: 'sub-1',
					name: 'Арабский',
					description: '',
					levels: [{ _count: { steps: 3 } }, { _count: { steps: 2 } }],
					_count: { levels: 2 },
				},
				{
					id: 'sub-2',
					name: 'Коран',
					description: 'Описание',
					levels: [{ _count: { steps: 10 } }],
					_count: { levels: 1 },
				},
			])

			const { getSubjects } = await import('./subject-actions')
			const result = await getSubjects()

			expect(requireRolesMock).toHaveBeenCalledWith(['MANAGER', 'SUPER_ADMIN'])
			expect(subjectFindManyMock).toHaveBeenCalledWith({
				include: {
					levels: {
						include: {
							_count: { select: { steps: true } },
						},
					},
					_count: { select: { levels: true } },
				},
				orderBy: { name: 'asc' },
			})
			expect(result).toHaveLength(2)
			expect(result[0]?.name).toBe('Арабский')
			expect(result[0]?._count.levels).toBe(2)
			expect(result[1]?.name).toBe('Коран')
		})
	})

	describe('createSubject', () => {
		it('rejects name shorter than 2 characters via Zod', async () => {
			const { createSubject } = await import('./subject-actions')

			await expect(
				createSubject({ name: 'А', description: '' }),
			).rejects.toThrow()
			expect(subjectCreateMock).not.toHaveBeenCalled()
		})

		it('creates subject and revalidates list path', async () => {
			subjectCreateMock.mockResolvedValue({
				id: 'sub-new',
				name: 'Таджвид',
				description: '',
			})

			const { createSubject } = await import('./subject-actions')
			const result = await createSubject({
				name: 'Таджвид',
				description: '',
			})

			expect(subjectCreateMock).toHaveBeenCalledWith({
				data: { name: 'Таджвид', description: '' },
			})
			expect(revalidatePathMock).toHaveBeenCalledWith('/admin/subjects')
			expect(result.name).toBe('Таджвид')
		})
	})

	describe('deleteSubject', () => {
		it('throws when subject has one or more levels', async () => {
			levelCountMock.mockResolvedValue(2)

			const { deleteSubject } = await import('./subject-actions')

			await expect(deleteSubject('sub-1')).rejects.toThrow(
				'Нельзя удалить предмет с программой. Сначала удалите все уровни.',
			)
			expect(subjectDeleteMock).not.toHaveBeenCalled()
		})

		it('deletes subject when it has no levels', async () => {
			levelCountMock.mockResolvedValue(0)
			subjectDeleteMock.mockResolvedValue({ id: 'sub-1' })

			const { deleteSubject } = await import('./subject-actions')
			await deleteSubject('sub-1')

			expect(levelCountMock).toHaveBeenCalledWith({
				where: { subjectId: 'sub-1' },
			})
			expect(subjectDeleteMock).toHaveBeenCalledWith({
				where: { id: 'sub-1' },
			})
			expect(revalidatePathMock).toHaveBeenCalledWith('/admin/subjects')
		})
	})
})
