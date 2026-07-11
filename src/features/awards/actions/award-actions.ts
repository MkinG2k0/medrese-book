'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { primaryEnrollmentOrderBy } from '@/shared/lib/enrollment'
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
	const students = await prisma.student.findMany({
		include: {
			user: true,
			enrollments: {
				orderBy: primaryEnrollmentOrderBy,
				take: 1,
				select: { currentStepIdx: true },
			},
			sessions: { select: { attendance: true, lateMinutes: true } },
		},
		orderBy: { user: { name: 'asc' } },
	})

	return students
		.map((student) => ({
			id: student.id,
			name: student.user.name,
			currentStepIdx: student.enrollments[0]?.currentStepIdx ?? 0,
			absences: student.sessions.filter((s) => s.attendance === 'ABSENT').length,
			lateCount: student.sessions.filter((s) => s.attendance === 'LATE').length,
		}))
		.sort((a, b) => b.currentStepIdx - a.currentStepIdx)
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
