'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export async function getProgramStepsForExtraAssignments() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const levels = await prisma.level.findMany({
		orderBy: { number: 'asc' },
		include: {
			steps: {
				orderBy: { order: 'asc' },
				select: { id: true, order: true, title: true, levelId: true },
			},
		},
	})

	return levels.map((level) => ({
		id: level.id,
		number: level.number,
		title: level.title,
		steps: level.steps,
	}))
}
