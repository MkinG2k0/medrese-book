'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

const createAwardSchema = z.object({
	studentId: z.string(),
	type: z.enum(['STUDY', 'ACTIVITY']),
	title: z.string().min(1),
})

export async function getAwards() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return prisma.award.findMany({
		include: { student: { include: { user: true } } },
		orderBy: { date: 'desc' },
	})
}

export async function getStudentsForAwards() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return prisma.student.findMany({
		include: { user: true },
		orderBy: { user: { name: 'asc' } },
	})
}

export async function createAward(input: unknown) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const data = createAwardSchema.parse(input)

	const award = await prisma.award.create({ data })
	revalidatePath('/admin/awards')
	return award
}

export async function deleteAward(awardId: string) {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	await prisma.award.delete({ where: { id: awardId } })
	revalidatePath('/admin/awards')
}
