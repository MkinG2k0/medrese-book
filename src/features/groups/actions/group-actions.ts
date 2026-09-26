'use server'

import { revalidatePath } from 'next/cache'

import { getLevels } from '@/features/program-admin/actions/program-actions'
import type { Prisma } from '@/shared/lib/db'
import { prisma } from '@/shared/lib/prisma'
import { getStepOffsetForLevel } from '@/shared/lib/student-progress/offsets'
import { syncCompletionsForProgress } from '@/shared/lib/student-progress'
import { requireRoles } from '@/shared/lib/session'
import {
	enrollStudentSchema,
	enrollStudentsSchema,
	transferStudentSchema,
	unenrollStudentSchema,
} from '@/shared/lib/validations/enrollment'
import {
	createGroupSchema,
	updateGroupSchema,
} from '@/shared/lib/validations/group'

const enrollmentInclude = {
	include: {
		student: { include: { user: true } },
		level: true,
	},
	orderBy: { student: { user: { name: 'asc' as const } } },
} as const

type EnrollmentLevel = {
	id: string
	number: number
	steps: { id: string; order: number }[]
}

async function createEnrollmentInTx(
	tx: Prisma.TransactionClient,
	params: {
		studentId: string
		groupId: string
		levelId: string
		subjectId: string
		level: EnrollmentLevel
		localStepIndex: number
	},
) {
	const stepOffset = await getStepOffsetForLevel(
		params.level.number,
		params.subjectId,
	)
	const currentStepIdx = stepOffset + params.localStepIndex

	await tx.groupEnrollment.create({
		data: {
			studentId: params.studentId,
			groupId: params.groupId,
			levelId: params.levelId,
			currentStepIdx,
		},
	})

	await syncCompletionsForProgress(
		tx,
		params.studentId,
		params.groupId,
		params.level.steps,
		params.localStepIndex,
	)
}

async function resolveEnrollmentTarget(
	groupId: string,
	levelId: string,
	localStepIndex: number,
) {
	const group = await prisma.group.findUnique({
		where: { id: groupId },
		select: { subjectId: true },
	})
	if (!group) {
		throw new Error('Группа не найдена')
	}

	const level = await prisma.level.findFirst({
		where: { id: levelId, subjectId: group.subjectId },
		include: { steps: { orderBy: { order: 'asc' } } },
	})
	if (!level) {
		throw new Error('Уровень не принадлежит предмету группы')
	}

	if (localStepIndex > level.steps.length) {
		throw new Error('Шаг выходит за пределы уровня')
	}

	return { group, level, localStepIndex }
}

function revalidateEnrollmentPaths(groupId: string) {
	revalidatePath(`/groups/${groupId}`)
	revalidatePath('/groups')
	revalidatePath('/journal')
}

export async function getGroups() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.group.findMany({
		include: {
			teacher: { include: { user: true } },
			subject: true,
			_count: { select: { enrollments: true } },
		},
		orderBy: { name: 'asc' },
	})
}

export async function getMyGroup() {
	const session = await requireRoles(['TEACHER'])

	if (!session.user.teacherId) return null

	return prisma.group.findFirst({
		where: { teacherId: session.user.teacherId },
		include: {
			teacher: { include: { user: true } },
			subject: true,
			enrollments: enrollmentInclude,
		},
	})
}

export async function getMyGroupById(groupId: string) {
	const session = await requireRoles(['TEACHER'])

	if (!session.user.teacherId) return null

	return prisma.group.findFirst({
		where: { id: groupId, teacherId: session.user.teacherId },
		include: {
			teacher: { include: { user: true } },
			subject: true,
			enrollments: enrollmentInclude,
		},
	})
}

export async function getGroup(groupId: string) {
	const session = await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			teacher: { include: { user: true } },
			subject: true,
			enrollments: enrollmentInclude,
		},
	})

	return { group, session }
}

export async function createGroup(input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = createGroupSchema.parse(input)

	const group = await prisma.group.create({ data })
	revalidatePath('/groups')
	revalidatePath('/my-group')
	return group
}

export async function updateGroup(groupId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = updateGroupSchema.parse(input)

	const existing = await prisma.group.findUnique({
		where: { id: groupId },
		select: { teacherId: true },
	})
	if (!existing) {
		throw new Error('Группа не найдена')
	}

	const group = await prisma.group.update({
		where: { id: groupId },
		data: { name: data.name, teacherId: data.teacherId },
	})
	revalidatePath('/groups')
	revalidatePath(`/groups/${groupId}`)
	revalidatePath('/my-group')
	revalidatePath('/journal')
	return group
}

export async function getTeachers() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.teacher.findMany({ include: { user: true } })
}

export async function enrollStudent(groupId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = enrollStudentSchema.parse(input)

	const { group, level, localStepIndex } = await resolveEnrollmentTarget(
		groupId,
		data.levelId,
		data.localStepIndex ?? 0,
	)

	const existing = await prisma.groupEnrollment.findUnique({
		where: {
			studentId_groupId: {
				studentId: data.studentId,
				groupId,
			},
		},
	})
	if (existing) {
		throw new Error('Ученик уже зачислен в эту группу')
	}

	await prisma.$transaction(async (tx) => {
		await createEnrollmentInTx(tx, {
			studentId: data.studentId,
			groupId,
			levelId: data.levelId,
			subjectId: group.subjectId,
			level,
			localStepIndex,
		})
	})

	revalidateEnrollmentPaths(groupId)
}

export async function enrollStudents(groupId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = enrollStudentsSchema.parse(input)

	const { group, level, localStepIndex } = await resolveEnrollmentTarget(
		groupId,
		data.levelId,
		data.localStepIndex ?? 0,
	)

	const duplicates = await prisma.groupEnrollment.findMany({
		where: {
			groupId,
			studentId: { in: data.studentIds },
		},
		select: { studentId: true },
	})
	if (duplicates.length > 0) {
		throw new Error(
			'Один или несколько учеников уже зачислены в эту группу',
		)
	}

	await prisma.$transaction(async (tx) => {
		for (const studentId of data.studentIds) {
			await createEnrollmentInTx(tx, {
				studentId,
				groupId,
				levelId: data.levelId,
				subjectId: group.subjectId,
				level,
				localStepIndex,
			})
		}
	})

	revalidateEnrollmentPaths(groupId)
}

export async function unenrollStudent(groupId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = unenrollStudentSchema.parse(input)

	await prisma.groupEnrollment.delete({
		where: {
			studentId_groupId: {
				studentId: data.studentId,
				groupId,
			},
		},
	})

	revalidateEnrollmentPaths(groupId)
}

export async function listTransferTargetGroups(fromGroupId: string) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const fromGroup = await prisma.group.findUnique({
		where: { id: fromGroupId },
		select: { id: true, subjectId: true },
	})
	if (!fromGroup) {
		throw new Error('Группа не найдена')
	}

	const groups = await prisma.group.findMany({
		where: {
			subjectId: fromGroup.subjectId,
			id: { not: fromGroupId },
		},
		include: {
			teacher: { include: { user: { select: { name: true } } } },
		},
		orderBy: { name: 'asc' },
	})

	return groups.map((group) => ({
		id: group.id,
		name: group.name,
		teacherName: group.teacher.user.name,
	}))
}

/**
 * Переносит зачисление в другую группу того же предмета.
 * Сохраняет levelId и currentStepIdx; историю сессий старой группы не трогает.
 */
export async function transferStudent(fromGroupId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = transferStudentSchema.parse(input)

	if (data.toGroupId === fromGroupId) {
		throw new Error('Выберите другую группу')
	}

	const [fromGroup, toGroup, sourceEnrollment, targetEnrollment] =
		await Promise.all([
			prisma.group.findUnique({
				where: { id: fromGroupId },
				select: { id: true, subjectId: true },
			}),
			prisma.group.findUnique({
				where: { id: data.toGroupId },
				select: { id: true, subjectId: true },
			}),
			prisma.groupEnrollment.findUnique({
				where: {
					studentId_groupId: {
						studentId: data.studentId,
						groupId: fromGroupId,
					},
				},
				select: {
					id: true,
					levelId: true,
					currentStepIdx: true,
				},
			}),
			prisma.groupEnrollment.findUnique({
				where: {
					studentId_groupId: {
						studentId: data.studentId,
						groupId: data.toGroupId,
					},
				},
				select: { id: true },
			}),
		])

	if (!fromGroup) throw new Error('Исходная группа не найдена')
	if (!toGroup) throw new Error('Целевая группа не найдена')
	if (fromGroup.subjectId !== toGroup.subjectId) {
		throw new Error('Перенос возможен только между группами одного предмета')
	}
	if (!sourceEnrollment) {
		throw new Error('Ученик не зачислен в исходную группу')
	}
	if (targetEnrollment) {
		throw new Error('Ученик уже зачислен в целевую группу')
	}

	await prisma.$transaction(async (tx) => {
		await tx.groupEnrollment.delete({
			where: { id: sourceEnrollment.id },
		})
		await tx.groupEnrollment.create({
			data: {
				studentId: data.studentId,
				groupId: data.toGroupId,
				levelId: sourceEnrollment.levelId,
				currentStepIdx: sourceEnrollment.currentStepIdx,
			},
		})
	})

	revalidateEnrollmentPaths(fromGroupId)
	revalidateEnrollmentPaths(data.toGroupId)
}

export async function searchStudentsForEnroll(groupId: string, query?: string) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const enrolled = await prisma.groupEnrollment.findMany({
		where: { groupId },
		select: { studentId: true },
	})
	const excludeIds = enrolled.map((row) => row.studentId)

	const students = await prisma.student.findMany({
		where: {
			...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
			...(query
				? { user: { name: { contains: query, mode: 'insensitive' } } }
				: {}),
		},
		include: { user: true },
		orderBy: { user: { name: 'asc' } },
		take: 200,
	})

	return students.map((student) => ({
		id: student.id,
		name: student.user.name,
	}))
}

export async function getGroupLevels(groupId: string) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		select: { subjectId: true },
	})
	if (!group) {
		throw new Error('Группа не найдена')
	}

	return getLevels(group.subjectId)
}
