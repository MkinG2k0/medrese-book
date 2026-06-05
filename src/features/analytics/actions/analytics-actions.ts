'use server'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

export async function getAnalyticsTeachers() {
	await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const teachers = await prisma.teacher.findMany({
		include: { user: true },
		orderBy: { user: { name: 'asc' } },
	})

	return teachers.map((teacher) => ({
		id: teacher.id,
		name: teacher.user.name,
	}))
}
