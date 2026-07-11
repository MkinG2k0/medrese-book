'use server'

import { revalidatePath } from 'next/cache'

import { getLevels } from '@/features/program-admin/actions/program-actions'
import { prisma } from '@/shared/lib/prisma'
import { getStepOffsetForLevel } from '@/shared/lib/student-progress/offsets'
import { syncCompletionsForProgress } from '@/shared/lib/student-progress'
import { requireRoles } from '@/shared/lib/session'
import {
	enrollStudentSchema,
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

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		select: { subjectId: true },
	})
	if (!group) {
		throw new Error('Группа не найдена')
	}

	const level = await prisma.level.findFirst({
		where: { id: data.levelId, subjectId: group.subjectId },
		include: { steps: { orderBy: { order: 'asc' } } },
	})
	if (!level) {
		throw new Error('Уровень не принадлежит предмету группы')
	}

	const localStepIndex = data.localStepIndex ?? 0
	if (localStepIndex > level.steps.length) {
		throw new Error('Шаг выходит за пределы уровня')
	}

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

	const stepOffset = await getStepOffsetForLevel(level.number, group.subjectId)
	const currentStepIdx = stepOffset + localStepIndex

	await prisma.$transaction(async (tx) => {
		await tx.groupEnrollment.create({
			data: {
				studentId: data.studentId,
				groupId,
				levelId: data.levelId,
				currentStepIdx,
			},
		})

		await syncCompletionsForProgress(
			tx,
			data.studentId,
			groupId,
			level.steps,
			localStepIndex,
		)
	})

	revalidatePath(`/groups/${groupId}`)
	revalidatePath('/groups')
	revalidatePath('/journal')
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

	revalidatePath(`/groups/${groupId}`)
	revalidatePath('/groups')
	revalidatePath('/journal')
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
		take: 50,
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
