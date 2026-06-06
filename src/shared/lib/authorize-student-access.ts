import type { Role } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

const EDIT_ROLES: Role[] = ['TEACHER', 'MANAGER', 'SUPER_ADMIN']

export async function requireStudentEditAccess(studentId: string) {
	const session = await requireRoles(EDIT_ROLES)

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
			group: { include: { teacher: { include: { user: true } } } },
			level: true,
		},
	})

	if (!student) return { session, student: null } as const

	if (
		session.user.role === 'TEACHER' &&
		session.user.teacherId !== student.group.teacherId
	) {
		return { session, student: null } as const
	}

	return { session, student } as const
}
