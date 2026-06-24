import type { Session } from 'next-auth'
import type { NextResponse } from 'next/server'

import { forbidden, unauthorized } from '@/shared/api'
import { auth } from '@/shared/lib/auth'
import { prisma, type Role } from '@/shared/lib/prisma'

export type ApiAuthContext = {
	groupId?: string | null
	studentId?: string | null
	completionId?: string | null
}

type AuthorizeOptions = {
	allowedRoles?: Role[]
	context?: ApiAuthContext
}

type AuthorizeSuccess = { session: Session }
type AuthorizeFailure = { error: NextResponse }

export async function authorizeApiRequest(
	options: AuthorizeOptions = {},
): Promise<AuthorizeSuccess | AuthorizeFailure> {
	const session = await auth()
	if (!session?.user) return { error: unauthorized() }

	const { role, teacherId, studentId: actorStudentId } = session.user

	if (options.allowedRoles && !options.allowedRoles.includes(role)) {
		return { error: forbidden() }
	}

	const ctx = options.context ?? {}

	if (role === 'STUDENT') {
		if (ctx.studentId && ctx.studentId !== actorStudentId) {
			return { error: forbidden() }
		}
		if (ctx.groupId) {
			const own = await prisma.student.findUnique({
				where: { id: actorStudentId! },
				select: { groupId: true },
			})
			if (!own || own.groupId !== ctx.groupId) return { error: forbidden() }
		}
	}

	if (role === 'TEACHER' && ctx.completionId) {
		const completion = await prisma.stepCompletion.findUnique({
			where: { id: ctx.completionId },
			include: { student: { include: { group: true } } },
		})
		if (!completion || completion.student.group.teacherId !== teacherId) {
			return { error: forbidden() }
		}
	}

	if (role === 'TEACHER' && ctx.studentId) {
		const student = await prisma.student.findUnique({
			where: { id: ctx.studentId },
			include: { group: true },
		})
		if (!student || student.group.teacherId !== teacherId) {
			return { error: forbidden() }
		}
	}

	if (role === 'TEACHER' && ctx.groupId) {
		const group = await prisma.group.findUnique({ where: { id: ctx.groupId } })
		if (!group || group.teacherId !== teacherId) return { error: forbidden() }
	}

	return { session }
}
