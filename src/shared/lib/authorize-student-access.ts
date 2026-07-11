import type { Role } from '@/shared/lib/prisma'
import { findPrimaryEnrollment } from '@/shared/lib/enrollment'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'

const EDIT_ROLES: Role[] = ['TEACHER', 'MANAGER', 'SUPER_ADMIN']

export async function requireStudentEditAccess(studentId: string) {
	const session = await requireRoles(EDIT_ROLES)

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: {
			user: true,
		},
	})

	if (!student) return { session, student: null, enrollment: null } as const

	const enrollment = await findPrimaryEnrollment(studentId)
	if (!enrollment) return { session, student: null, enrollment: null } as const

	if (
		session.user.role === 'TEACHER' &&
		session.user.teacherId !== enrollment.group.teacherId
	) {
		return { session, student: null, enrollment: null } as const
	}

	return { session, student, enrollment } as const
}
