'use server'

import { revalidatePath } from 'next/cache'

import {
	programLevelPath,
	programListPath,
} from '@/features/program-admin/lib/program-paths'
import { prisma, type Prisma } from '@/shared/lib/prisma'
import { invalidateStepOffsetCache } from '@/shared/lib/student-progress'
import { requireRoles } from '@/shared/lib/session'
import { createLevelSchema, updateLevelSchema } from '@/shared/lib/validations/level'
import { createStepSchema, stepContentSchema } from '@/shared/lib/validations/step'

type Tx = Prisma.TransactionClient

async function reserveStepOrderSlot(tx: Tx, levelId: string, order: number) {
	const stepsToShift = await tx.step.findMany({
		where: { levelId, order: { gte: order } },
		orderBy: { order: 'desc' },
	})
	for (const step of stepsToShift) {
		await tx.step.update({
			where: { id: step.id },
			data: { order: step.order + 1 },
		})
	}
}

async function moveStepOrder(
	tx: Tx,
	levelId: string,
	stepId: string,
	oldOrder: number,
	newOrder: number,
) {
	if (oldOrder === newOrder) return

	const { _max } = await tx.step.aggregate({
		where: { levelId },
		_max: { order: true },
	})
	await tx.step.update({
		where: { id: stepId },
		data: { order: (_max.order ?? 0) + 1000 },
	})

	if (newOrder < oldOrder) {
		const stepsToShift = await tx.step.findMany({
			where: { levelId, order: { gte: newOrder, lt: oldOrder } },
			orderBy: { order: 'desc' },
		})
		for (const step of stepsToShift) {
			await tx.step.update({
				where: { id: step.id },
				data: { order: step.order + 1 },
			})
		}
	} else {
		const stepsToShift = await tx.step.findMany({
			where: { levelId, order: { gt: oldOrder, lte: newOrder } },
			orderBy: { order: 'asc' },
		})
		for (const step of stepsToShift) {
			await tx.step.update({
				where: { id: step.id },
				data: { order: step.order - 1 },
			})
		}
	}
}

export async function getLevels(subjectId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findMany({
		where: { subjectId },
		include: { _count: { select: { steps: true } } },
		orderBy: { number: 'asc' },
	})
}

export async function getLevel(levelId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findUnique({ where: { id: levelId } })
}

export async function getLevelSteps(subjectId: string, levelId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findFirst({
		where: { id: levelId, subjectId },
		include: { steps: { orderBy: { order: 'asc' } } },
	})
}

export async function createLevel(input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createLevelSchema.parse(input)

	const subject = await prisma.subject.findUnique({
		where: { id: data.subjectId },
	})
	if (!subject) {
		throw new Error('Предмет не найден')
	}

	const level = await prisma.level.create({ data })
	invalidateStepOffsetCache(data.subjectId)
	revalidatePath(programListPath(data.subjectId))
	revalidatePath('/admin/subjects')
	return level
}

export async function updateLevel(levelId: string, input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = updateLevelSchema.parse(input)

	if (data.subjectId) {
		const subject = await prisma.subject.findUnique({
			where: { id: data.subjectId },
		})
		if (!subject) {
			throw new Error('Предмет не найден')
		}
	}

	const existing = await prisma.level.findUniqueOrThrow({
		where: { id: levelId },
	})
	const level = await prisma.level.update({
		where: { id: levelId },
		data,
	})

	invalidateStepOffsetCache(level.subjectId)
	if (existing.subjectId !== level.subjectId) {
		invalidateStepOffsetCache(existing.subjectId)
	}

	revalidatePath(programListPath(level.subjectId))
	revalidatePath(programLevelPath(level.subjectId, levelId))
	if (existing.subjectId !== level.subjectId) {
		revalidatePath(programListPath(existing.subjectId))
	}
	revalidatePath('/admin/subjects')
	return level
}

export async function deleteLevel(subjectId: string, levelId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])

	const level = await prisma.level.findFirst({
		where: { id: levelId, subjectId },
	})
	if (!level) {
		throw new Error('Уровень не найден')
	}

	const enrollmentCount = await prisma.groupEnrollment.count({ where: { levelId } })
	if (enrollmentCount > 0) {
		throw new Error('Нельзя удалить уровень с учениками')
	}

	await prisma.level.delete({ where: { id: levelId } })
	invalidateStepOffsetCache(subjectId)
	revalidatePath(programListPath(subjectId))
	revalidatePath('/admin/subjects')
}

export async function getStep(stepId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.step.findUnique({ where: { id: stepId } })
}

export async function createStep(input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createStepSchema.parse(input)
	stepContentSchema.parse(data.content)
	if (data.teacherNote) stepContentSchema.parse(data.teacherNote)

	const level = await prisma.level.findUniqueOrThrow({
		where: { id: data.levelId },
	})

	const step = await prisma.$transaction(async (tx) => {
		await reserveStepOrderSlot(tx, data.levelId, data.order)
		return tx.step.create({ data })
	})

	invalidateStepOffsetCache(level.subjectId)
	revalidatePath(programLevelPath(level.subjectId, data.levelId))
	return step
}

export async function updateStep(stepId: string, input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createStepSchema.partial().parse(input)
	if (data.content) stepContentSchema.parse(data.content)
	if (data.teacherNote) stepContentSchema.parse(data.teacherNote)

	const current = await prisma.step.findUniqueOrThrow({ where: { id: stepId } })
	const levelId = data.levelId ?? current.levelId
	const newOrder = data.order

	const level = await prisma.level.findUniqueOrThrow({ where: { id: levelId } })

	const step = await prisma.$transaction(async (tx) => {
		if (newOrder !== undefined && newOrder !== current.order) {
			await moveStepOrder(tx, levelId, stepId, current.order, newOrder)
		}
		return tx.step.update({
			where: { id: stepId },
			data,
		})
	})

	invalidateStepOffsetCache(level.subjectId)
	revalidatePath(programLevelPath(level.subjectId, step.levelId))
	return step
}

export async function deleteStep(stepId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const step = await prisma.step.delete({ where: { id: stepId } })
	const level = await prisma.level.findUniqueOrThrow({
		where: { id: step.levelId },
	})

	invalidateStepOffsetCache(level.subjectId)
	revalidatePath(programLevelPath(level.subjectId, step.levelId))
}
