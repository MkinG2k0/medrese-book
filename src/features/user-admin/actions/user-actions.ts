'use server'

import { revalidatePath } from 'next/cache'

import { getDefaultLevelId } from '@/shared/lib/default-level'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { generateUniqueCode } from '@/shared/lib/generate-unique-code'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import {
	getStepOffsetForLevel,
	syncCompletionsForProgress,
} from '@/shared/lib/student-progress'
import {
	createUsersSchema,
	updateStaffUserSchema,
	updateStudentUserSchema,
} from '@/shared/lib/validations/user'

export async function getUsers() {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	return prisma.user.findMany({
		where: { role: { not: 'SUPER_ADMIN' } },
		include: {
			teacher: { include: { groups: true } },
			student: {
				include: {
					parent: {
						select: { id: true, name: true, phone: true },
					},
					enrollments: {
						include: {
							group: true,
							level: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: 'desc' },
	})
}

export async function getLevelsWithStepsForSubject(subjectId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	return prisma.level.findMany({
		where: { subjectId },
		include: { steps: { orderBy: { order: 'asc' } } },
		orderBy: { number: 'asc' },
	})
}

export async function getLevelsForStudentProfile() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	return prisma.level.findMany({
		include: { steps: { orderBy: { order: 'asc' } } },
		orderBy: { number: 'asc' },
	})
}

export async function searchParents(query?: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const parents = await prisma.user.findMany({
		where: {
			role: 'PARENT',
			...(query?.trim()
				? {
						OR: [
							{ name: { contains: query.trim(), mode: 'insensitive' } },
							{ phone: { contains: query.trim(), mode: 'insensitive' } },
						],
					}
				: {}),
		},
		select: {
			id: true,
			name: true,
			phone: true,
			_count: { select: { children: true } },
		},
		orderBy: { name: 'asc' },
		take: 50,
	})

	return parents.map((parent) => ({
		id: parent.id,
		name: parent.name,
		phone: parent.phone,
		childrenCount: parent._count.children,
	}))
}

export async function createUsers(input: unknown) {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const data = createUsersSchema.parse(input)

	let level:
		| {
				id: string
				number: number
				steps: { id: string }[]
		  }
		| undefined

	let groupSubjectId: string | undefined

	if (data.role === 'STUDENT') {
		const levelId = data.levelId ?? (await getDefaultLevelId())
		const group = await prisma.group.findUnique({
			where: { id: data.groupId! },
			select: { subjectId: true },
		})

		if (!group) {
			throw new Error('Группа не найдена')
		}

		groupSubjectId = group.subjectId

		const foundLevel = await prisma.level.findFirst({
			where: { id: levelId, subjectId: group.subjectId },
			include: { steps: { orderBy: { order: 'asc' } } },
		})

		if (!foundLevel) {
			throw new Error('Уровень не принадлежит предмету группы')
		}

		const localStepIndex = data.localStepIndex ?? 0
		if (localStepIndex > foundLevel.steps.length) {
			throw new Error('Шаг выходит за пределы уровня')
		}

		level = foundLevel
	}

	if (data.parentId) {
		const parent = await prisma.user.findFirst({
			where: { id: data.parentId, role: 'PARENT' },
			select: { id: true },
		})
		if (!parent) {
			throw new Error('Опекун не найден')
		}
	}

	const users: { name: string; code: string; role: string }[] = []

	type ParentRef = {
		id: string
		name: string
		phone: string | null
	}

	let sharedParent: ParentRef | null = null

	if (data.role === 'STUDENT' && data.parentId) {
		const parent = await prisma.user.findUniqueOrThrow({
			where: { id: data.parentId },
			select: { id: true, name: true, phone: true },
		})
		sharedParent = parent
	} else if (
		data.role === 'STUDENT' &&
		(data.guardianName || data.guardianPhone)
	) {
		const parentCode = await generateUniqueCode()
		const parentName = data.guardianName?.trim() || 'Опекун'
		const parent = await prisma.user.create({
			data: {
				name: parentName,
				code: parentCode,
				role: 'PARENT',
				phone: data.guardianPhone ?? null,
			},
			select: { id: true, name: true, phone: true, code: true },
		})
		sharedParent = parent
		users.push({ name: parent.name, code: parent.code, role: 'PARENT' })
	}

	for (const entry of data.entries) {
		const code = await generateUniqueCode()

		if (data.role === 'STUDENT' && level) {
			const localStepIndex = data.localStepIndex ?? 0
			const stepOffset = await getStepOffsetForLevel(
				level.number,
				groupSubjectId,
			)
			const currentStepIdx = stepOffset + localStepIndex

			const created = await prisma.$transaction(async (tx) => {
				let parentRef = sharedParent

				if (!parentRef) {
					const parentCode = await generateUniqueCode()
					const parentName = `Опекун ${entry.name}`
					const parent = await tx.user.create({
						data: {
							name: parentName,
							code: parentCode,
							role: 'PARENT',
							phone: null,
						},
						select: { id: true, name: true, phone: true, code: true },
					})
					parentRef = parent
					users.push({
						name: parent.name,
						code: parent.code,
						role: 'PARENT',
					})
				}

				const user = await tx.user.create({
					data: {
						name: entry.name,
						code,
						role: data.role,
						student: {
							create: {
								fullName: entry.fullName ?? entry.name,
								phone: entry.phone,
								guardianName: parentRef.name,
								guardianPhone: parentRef.phone,
								parentId: parentRef.id,
							},
						},
					},
					include: { student: true },
				})

				await tx.groupEnrollment.create({
					data: {
						studentId: user.student!.id,
						groupId: data.groupId!,
						levelId: level.id,
						currentStepIdx,
					},
				})

				await syncCompletionsForProgress(
					tx,
					user.student!.id,
					data.groupId!,
					level.steps,
					localStepIndex,
				)

				await dispatchDomainEvent(
					{
						actorId: session.user.id,
						action: 'STUDENT_CREATED',
						entityType: 'Student',
						entityId: user.student!.id,
						payload: {
							userId: user.id,
							levelId: level.id,
							currentStepIdx,
							localStepIndex,
							groupId: data.groupId,
							parentId: parentRef.id,
						},
					},
					tx,
				)

				return user
			})

			users.push({
				name: created.name,
				code: created.code,
				role: 'STUDENT',
			})
			revalidatePath(`/groups/${data.groupId}`)
			continue
		}

		await prisma.user.create({
			data: {
				name: entry.name,
				code,
				role: data.role,
				phone: data.phone,
				...(data.role === 'TEACHER' && {
					teacher: { create: {} },
				}),
			},
		})

		users.push({ name: entry.name, code, role: data.role })
	}

	revalidatePath('/admin/users')
	revalidatePath('/groups')
	revalidatePath('/journal')
	revalidatePath('/parent/me')
	return { users }
}

export async function updateUser(userId: string, input: unknown) {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { student: true },
	})

	if (!user) {
		throw new Error('Пользователь не найден')
	}

	if (user.role === 'STUDENT' && user.student) {
		const data = updateStudentUserSchema.parse(input)

		const enrollment = await prisma.groupEnrollment.findFirst({
			where: { studentId: user.student.id },
			include: {
				group: { select: { subjectId: true } },
				level: {
					include: { steps: { orderBy: { order: 'asc' } } },
				},
			},
			orderBy: { enrolledAt: 'asc' },
		})

		if (!enrollment) {
			throw new Error('Ученик не зачислен ни в одну группу')
		}

		const level = enrollment.level

		if (data.localStepIndex > level.steps.length) {
			throw new Error('Шаг выходит за пределы уровня')
		}

		const previousStepIdx = enrollment.currentStepIdx
		const stepOffset = await getStepOffsetForLevel(
			level.number,
			enrollment.group.subjectId,
		)
		const currentStepIdx = stepOffset + data.localStepIndex

		let parentPatch: {
			parentId: string | null
			guardianName: string | null
			guardianPhone: string | null
		} | null = null

		if (data.parentId !== undefined) {
			if (data.parentId === null || data.parentId === '') {
				parentPatch = {
					parentId: null,
					guardianName: data.guardianName ?? null,
					guardianPhone: data.guardianPhone ?? null,
				}
			} else {
				const parent = await prisma.user.findFirst({
					where: { id: data.parentId, role: 'PARENT' },
					select: { id: true, name: true, phone: true },
				})
				if (!parent) {
					throw new Error('Опекун не найден')
				}
				parentPatch = {
					parentId: parent.id,
					guardianName: parent.name,
					guardianPhone: parent.phone,
				}
			}
		}

		const enrollments = await prisma.groupEnrollment.findMany({
			where: { studentId: user.student.id },
			select: { groupId: true },
		})

		await prisma.$transaction(async (tx) => {
			await syncCompletionsForProgress(
				tx,
				user.student!.id,
				enrollment.groupId,
				level.steps,
				data.localStepIndex,
			)

			await tx.groupEnrollment.update({
				where: { id: enrollment.id },
				data: { currentStepIdx },
			})

			await tx.student.update({
				where: { id: user.student!.id },
				data: {
					fullName: data.name,
					phone: data.phone,
					status: data.status,
					...(parentPatch
						? parentPatch
						: {
								guardianName: data.guardianName,
								guardianPhone: data.guardianPhone,
							}),
				},
			})

			await tx.user.update({
				where: { id: userId },
				data: { name: data.name },
			})

			await dispatchDomainEvent(
				{
					actorId: session.user.id,
					action: 'STUDENT_UPDATED',
					entityType: 'Student',
					entityId: user.student!.id,
					payload: {
						userId,
						previousLevelId: enrollment.levelId,
						previousStepIdx,
						levelId: enrollment.levelId,
						currentStepIdx,
						localStepIndex: data.localStepIndex,
						status: data.status,
					},
				},
				tx,
			)
		})

		revalidatePath('/admin/users')
		revalidatePath('/groups')
		revalidatePath('/my-group')
		for (const { groupId } of enrollments) {
			revalidatePath(`/groups/${groupId}`)
		}
		revalidatePath('/journal')
		revalidatePath(`/journal/${user.student.id}`)
		revalidatePath(`/students/${user.student.id}/edit`)
		revalidatePath('/student/me')
		revalidatePath('/student/lessons')
		revalidatePath('/student/history')
		revalidatePath('/student/awards')
		revalidatePath('/parent/me')
		return
	}

	const data = updateStaffUserSchema.parse(input)

	await prisma.user.update({
		where: { id: userId },
		data: {
			name: data.name,
			phone: data.phone,
		},
	})

	revalidatePath('/admin/users')
}

export async function resetUserCode(userId: string) {
	await requireRoles(['SUPER_ADMIN'])

	const code = await generateUniqueCode()
	await prisma.user.update({
		where: { id: userId },
		data: { code },
	})

	revalidatePath('/admin/users')
	return { code }
}

export async function deleteUser(userId: string) {
	const session = await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			teacher: { include: { groups: true } },
			student: true,
		},
	})

	if (!user) {
		throw new Error('Пользователь не найден')
	}

	if (user.role === 'SUPER_ADMIN') {
		throw new Error('Нельзя удалить супер-админа')
	}

	if (user.id === session.user.id) {
		throw new Error('Нельзя удалить собственную учётную запись')
	}

	if (user.role === 'TEACHER' && user.teacher) {
		if (user.teacher.groups.length > 0) {
			throw new Error(
				'Нельзя удалить учителя с группами. Сначала переназначьте группы другому учителю.',
			)
		}

		const teacherId = user.teacher.id

		await prisma.$transaction(async (tx) => {
			await tx.leaveRequest.updateMany({
				where: { substituteTeacherId: teacherId },
				data: { substituteTeacherId: null },
			})
			await tx.leaveRequest.deleteMany({ where: { teacherId } })
			await tx.substitution.deleteMany({
				where: {
					OR: [
						{ absentTeacherId: teacherId },
						{ substituteTeacherId: teacherId },
					],
				},
			})
			await tx.teachingSession.deleteMany({ where: { teacherId } })
			await tx.user.delete({ where: { id: userId } })
		})
	} else {
		const studentId = user.student?.id
		const enrollmentGroupIds =
			user.student
				? (
						await prisma.groupEnrollment.findMany({
							where: { studentId: user.student.id },
							select: { groupId: true },
						})
					).map((enrollment) => enrollment.groupId)
				: []

		await prisma.user.delete({ where: { id: userId } })

		if (studentId) {
			revalidatePath('/groups')
			revalidatePath('/my-group')
			for (const groupId of enrollmentGroupIds) {
				revalidatePath(`/groups/${groupId}`)
			}
			revalidatePath('/journal')
			revalidatePath(`/journal/${studentId}`)
		}
	}

	revalidatePath('/admin/users')
}
