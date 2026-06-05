'use server'

import { revalidatePath } from 'next/cache'

import { prisma, type Prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
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

export async function getLevels() {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findMany({
		include: { _count: { select: { steps: true } } },
		orderBy: { number: 'asc' },
	})
}

export async function getLevelSteps(levelId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.level.findUnique({
		where: { id: levelId },
		include: { steps: { orderBy: { order: 'asc' } } },
	})
}

export async function getStep(stepId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	return prisma.step.findUnique({ where: { id: stepId } })
}

export async function createStep(input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createStepSchema.parse(input)
	stepContentSchema.parse(data.content)

	const step = await prisma.$transaction(async (tx) => {
		await reserveStepOrderSlot(tx, data.levelId, data.order)
		return tx.step.create({ data })
	})
	revalidatePath(`/admin/program/${data.levelId}`)
	return step
}

export async function updateStep(stepId: string, input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createStepSchema.partial().parse(input)
	if (data.content) stepContentSchema.parse(data.content)

	const current = await prisma.step.findUniqueOrThrow({ where: { id: stepId } })
	const levelId = data.levelId ?? current.levelId
	const newOrder = data.order

	const step = await prisma.$transaction(async (tx) => {
		if (newOrder !== undefined && newOrder !== current.order) {
			await moveStepOrder(tx, levelId, stepId, current.order, newOrder)
		}
		return tx.step.update({
			where: { id: stepId },
			data,
		})
	})
	revalidatePath(`/admin/program/${step.levelId}`)
	return step
}

export async function deleteStep(stepId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const step = await prisma.step.delete({ where: { id: stepId } })
	revalidatePath(`/admin/program/${step.levelId}`)
}
