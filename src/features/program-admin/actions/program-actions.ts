'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import { createStepSchema, stepContentSchema } from '@/shared/lib/validations/step'

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

	const step = await prisma.step.create({ data })
	revalidatePath(`/admin/program/${data.levelId}`)
	return step
}

export async function updateStep(stepId: string, input: unknown) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const data = createStepSchema.partial().parse(input)
	if (data.content) stepContentSchema.parse(data.content)

	const step = await prisma.step.update({
		where: { id: stepId },
		data,
	})
	revalidatePath(`/admin/program/${step.levelId}`)
	return step
}

export async function deleteStep(stepId: string) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const step = await prisma.step.delete({ where: { id: stepId } })
	revalidatePath(`/admin/program/${step.levelId}`)
}
