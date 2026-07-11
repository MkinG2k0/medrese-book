import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRolesMock = vi.fn()
const groupFindManyMock = vi.fn()
const groupFindFirstMock = vi.fn()
const groupFindUniqueMock = vi.fn()
const groupCreateMock = vi.fn()
const groupUpdateMock = vi.fn()
const groupEnrollmentFindUniqueMock = vi.fn()
const groupEnrollmentCreateMock = vi.fn()
const groupEnrollmentDeleteMock = vi.fn()
const groupEnrollmentFindManyMock = vi.fn()
const levelFindFirstMock = vi.fn()
const studentFindManyMock = vi.fn()
const getLevelsMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock('@/features/program-admin/actions/program-actions', () => ({
	getLevels: (...args: unknown[]) => getLevelsMock(...args),
}))

vi.mock('@/shared/lib/session', () => ({
	requireRoles: (...args: unknown[]) => requireRolesMock(...args),
}))

vi.mock('next/cache', () => ({
	revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		group: {
			findMany: (...args: unknown[]) => groupFindManyMock(...args),
			findFirst: (...args: unknown[]) => groupFindFirstMock(...args),
			findUnique: (...args: unknown[]) => groupFindUniqueMock(...args),
			create: (...args: unknown[]) => groupCreateMock(...args),
			update: (...args: unknown[]) => groupUpdateMock(...args),
		},
		teacher: {
			findMany: vi.fn(),
		},
		groupEnrollment: {
			findUnique: (...args: unknown[]) => groupEnrollmentFindUniqueMock(...args),
			create: (...args: unknown[]) => groupEnrollmentCreateMock(...args),
			delete: (...args: unknown[]) => groupEnrollmentDeleteMock(...args),
			findMany: (...args: unknown[]) => groupEnrollmentFindManyMock(...args),
		},
		level: {
			findFirst: (...args: unknown[]) => levelFindFirstMock(...args),
		},
		student: {
			findMany: (...args: unknown[]) => studentFindManyMock(...args),
		},
	},
}))

describe('group-actions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		requireRolesMock.mockResolvedValue({
			user: { role: 'MANAGER', teacherId: 'teacher-1' },
		})
	})

	describe('createGroup', () => {
		it('rejects missing subjectId via Zod (T-11-04)', async () => {
			const { createGroup } = await import('./group-actions')

			await expect(
				createGroup({ name: 'Группа', teacherId: 'teacher-1' }),
			).rejects.toThrow()
			expect(groupCreateMock).not.toHaveBeenCalled()
		})

		it('persists subjectId in prisma.group.create', async () => {
			groupCreateMock.mockResolvedValue({
				id: 'group-1',
				name: 'Группа',
				teacherId: 'teacher-1',
				subjectId: 'subject-1',
			})

			const { createGroup } = await import('./group-actions')
			const result = await createGroup({
				name: 'Группа',
				teacherId: 'teacher-1',
				subjectId: 'subject-1',
			})

			expect(groupCreateMock).toHaveBeenCalledWith({
				data: {
					name: 'Группа',
					teacherId: 'teacher-1',
					subjectId: 'subject-1',
				},
			})
			expect(revalidatePathMock).toHaveBeenCalledWith('/groups')
			expect(result.subjectId).toBe('subject-1')
		})
	})

	describe('updateGroup', () => {
		it('ignores subjectId even when passed in input (D-07)', async () => {
			groupFindUniqueMock.mockResolvedValue({ teacherId: 'teacher-1' })
			groupUpdateMock.mockResolvedValue({
				id: 'group-1',
				name: 'Новое имя',
				teacherId: 'teacher-2',
				subjectId: 'subject-1',
			})

			const { updateGroup } = await import('./group-actions')
			await updateGroup('group-1', {
				name: 'Новое имя',
				teacherId: 'teacher-2',
				subjectId: 'subject-hacked',
			})

			expect(groupUpdateMock).toHaveBeenCalledWith({
				where: { id: 'group-1' },
				data: { name: 'Новое имя', teacherId: 'teacher-2' },
			})
		})
	})

	describe('getGroups', () => {
		it('includes subject and enrollment count ordered by name', async () => {
			groupFindManyMock.mockResolvedValue([
				{
					id: 'group-1',
					name: 'Аль-Фатиха',
					subject: { id: 'subject-1', name: 'Коран' },
					_count: { enrollments: 3 },
				},
			])

			const { getGroups } = await import('./group-actions')
			const result = await getGroups()

			expect(requireRolesMock).toHaveBeenCalledWith(['MANAGER', 'SUPER_ADMIN'])
			expect(groupFindManyMock).toHaveBeenCalledWith({
				include: {
					teacher: { include: { user: true } },
					subject: true,
					_count: { select: { enrollments: true } },
				},
				orderBy: { name: 'asc' },
			})
			expect(result[0]?._count.enrollments).toBe(3)
			expect(result[0]?.subject.name).toBe('Коран')
		})
	})

	describe('getGroup', () => {
		it('returns enrollments with student.user and level', async () => {
			groupFindUniqueMock.mockResolvedValue({
				id: 'group-1',
				name: 'Группа',
				subjectId: 'subject-1',
				teacher: { user: { name: 'Учитель' } },
				enrollments: [
					{
						levelId: 'level-1',
						student: {
							id: 'student-1',
							user: { name: 'Али' },
						},
						level: { id: 'level-1', title: 'Уровень 1' },
					},
				],
			})

			const { getGroup } = await import('./group-actions')
			const { group } = await getGroup('group-1')

			expect(groupFindUniqueMock).toHaveBeenCalledWith({
				where: { id: 'group-1' },
				include: {
					teacher: { include: { user: true } },
					subject: true,
					enrollments: {
						include: {
							student: { include: { user: true } },
							level: true,
						},
						orderBy: { student: { user: { name: 'asc' } } },
					},
				},
			})
			expect(group?.enrollments[0]?.student.user.name).toBe('Али')
			expect(group?.enrollments[0]?.level.title).toBe('Уровень 1')
		})
	})

	describe('getMyGroup', () => {
		it('loads enrollments instead of group.students', async () => {
			groupFindFirstMock.mockResolvedValue({
				id: 'group-1',
				name: 'Моя группа',
				subjectId: 'subject-1',
				enrollments: [
					{
						levelId: 'level-1',
						student: {
							id: 'student-1',
							user: { name: 'Усман' },
						},
						level: { id: 'level-1', title: 'Уровень 1' },
					},
				],
			})

			const { getMyGroup } = await import('./group-actions')
			const group = await getMyGroup()

			expect(requireRolesMock).toHaveBeenCalledWith(['TEACHER'])
			expect(groupFindFirstMock).toHaveBeenCalledWith({
				where: { teacherId: 'teacher-1' },
				include: {
					teacher: { include: { user: true } },
					subject: true,
					enrollments: {
						include: {
							student: { include: { user: true } },
							level: true,
						},
						orderBy: { student: { user: { name: 'asc' } } },
					},
				},
			})
			expect(group?.enrollments[0]?.student.user.name).toBe('Усман')
		})
	})

	describe('enrollStudent', () => {
		it('creates GroupEnrollment when level belongs to group subject', async () => {
			groupFindUniqueMock.mockResolvedValue({ subjectId: 'subject-1' })
			levelFindFirstMock.mockResolvedValue({ id: 'level-1' })
			groupEnrollmentFindUniqueMock.mockResolvedValue(null)
			groupEnrollmentCreateMock.mockResolvedValue({ id: 'enrollment-1' })

			const { enrollStudent } = await import('./group-actions')
			await enrollStudent('group-1', {
				studentId: 'student-1',
				levelId: 'level-1',
			})

			expect(levelFindFirstMock).toHaveBeenCalledWith({
				where: { id: 'level-1', subjectId: 'subject-1' },
			})
			expect(groupEnrollmentCreateMock).toHaveBeenCalledWith({
				data: {
					studentId: 'student-1',
					groupId: 'group-1',
					levelId: 'level-1',
				},
			})
			expect(revalidatePathMock).toHaveBeenCalledWith('/groups/group-1')
		})

		it('throws when level.subjectId does not match group subject (T-11-02)', async () => {
			groupFindUniqueMock.mockResolvedValue({ subjectId: 'subject-1' })
			levelFindFirstMock.mockResolvedValue(null)

			const { enrollStudent } = await import('./group-actions')
			await expect(
				enrollStudent('group-1', {
					studentId: 'student-1',
					levelId: 'level-wrong',
				}),
			).rejects.toThrow('Уровень не принадлежит предмету группы')
			expect(groupEnrollmentCreateMock).not.toHaveBeenCalled()
		})

		it('rejects duplicate studentId+groupId enrollment', async () => {
			groupFindUniqueMock.mockResolvedValue({ subjectId: 'subject-1' })
			levelFindFirstMock.mockResolvedValue({ id: 'level-1' })
			groupEnrollmentFindUniqueMock.mockResolvedValue({ id: 'existing' })

			const { enrollStudent } = await import('./group-actions')
			await expect(
				enrollStudent('group-1', {
					studentId: 'student-1',
					levelId: 'level-1',
				}),
			).rejects.toThrow('Ученик уже зачислен в эту группу')
			expect(groupEnrollmentCreateMock).not.toHaveBeenCalled()
		})
	})

	describe('unenrollStudent', () => {
		it('deletes enrollment by composite key', async () => {
			groupEnrollmentDeleteMock.mockResolvedValue({ id: 'enrollment-1' })

			const { unenrollStudent } = await import('./group-actions')
			await unenrollStudent('group-1', { studentId: 'student-1' })

			expect(groupEnrollmentDeleteMock).toHaveBeenCalledWith({
				where: {
					studentId_groupId: {
						studentId: 'student-1',
						groupId: 'group-1',
					},
				},
			})
		})
	})

	describe('searchStudentsForEnroll', () => {
		it('excludes students already enrolled in the group', async () => {
			groupEnrollmentFindManyMock.mockResolvedValue([
				{ studentId: 'student-1' },
			])
			studentFindManyMock.mockResolvedValue([
				{ id: 'student-2', user: { name: 'Билал' } },
			])

			const { searchStudentsForEnroll } = await import('./group-actions')
			const result = await searchStudentsForEnroll('group-1')

			expect(studentFindManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						id: { notIn: ['student-1'] },
					}),
				}),
			)
			expect(result).toEqual([{ id: 'student-2', name: 'Билал' }])
		})
	})

	describe('getGroupLevels', () => {
		it('loads levels for group subjectId', async () => {
			groupFindUniqueMock.mockResolvedValue({ subjectId: 'subject-1' })
			getLevelsMock.mockResolvedValue([{ id: 'level-1', number: 1 }])

			const { getGroupLevels } = await import('./group-actions')
			const result = await getGroupLevels('group-1')

			expect(getLevelsMock).toHaveBeenCalledWith('subject-1')
			expect(result).toHaveLength(1)
		})
	})
})
