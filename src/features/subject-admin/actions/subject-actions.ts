'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import {
	createSubjectSchema,
	updateSubjectSchema,
} from '@/shared/lib/validations/subject'

const BLOCKED_DELETE_MESSAGE =
	'Нельзя удалить предмет с программой. Сначала удалите все уровни.'

export async function getSubjects() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.subject.findMany({
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
}

export async function getSubject(subjectId: string) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	return prisma.subject.findUnique({
		where: { id: subjectId },
		include: {
			levels: {
				include: {
					_count: { select: { steps: true } },
				},
				orderBy: { number: 'asc' },
			},
			_count: { select: { levels: true } },
		},
	})
}

export async function createSubject(input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = createSubjectSchema.parse(input)

	const subject = await prisma.subject.create({ data })
	revalidatePath('/admin/subjects')
	return subject
}

export async function updateSubject(subjectId: string, input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = updateSubjectSchema.parse(input)

	const subject = await prisma.subject.update({
		where: { id: subjectId },
		data,
	})
	revalidatePath('/admin/subjects')
	revalidatePath(`/admin/subjects/${subjectId}/program`)
	return subject
}

export async function deleteSubject(subjectId: string) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])

	const levelCount = await prisma.level.count({
		where: { subjectId },
	})
	if (levelCount > 0) {
		throw new Error(BLOCKED_DELETE_MESSAGE)
	}

	await prisma.subject.delete({ where: { id: subjectId } })
	revalidatePath('/admin/subjects')
}
