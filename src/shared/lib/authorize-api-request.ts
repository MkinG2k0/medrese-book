import type { Session } from 'next-auth'
import type { NextResponse } from 'next/server'

import { forbidden, unauthorized } from '@/shared/api'
import { auth } from '@/shared/lib/auth'
import { getStudentGroupTeacherIds } from '@/shared/lib/enrollment'
import { canAccessGroupAsTeacher } from '@/shared/lib/group-access'
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

async function teacherCanAccessGroupTeacher(
	teacherId: string | null,
	groupTeacherId: string,
): Promise<boolean> {
	return canAccessGroupAsTeacher(teacherId, groupTeacherId)
}

async function teacherCanAccessStudent(
	teacherId: string | null,
	studentId: string,
): Promise<boolean> {
	const groupTeacherIds = await getStudentGroupTeacherIds(studentId)
	for (const groupTeacherId of groupTeacherIds) {
		if (await teacherCanAccessGroupTeacher(teacherId, groupTeacherId)) {
			return true
		}
	}
	return false
}

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
			const enrollment = await prisma.groupEnrollment.findUnique({
				where: {
					studentId_groupId: {
						studentId: actorStudentId!,
						groupId: ctx.groupId,
					},
				},
			})
			if (!enrollment) return { error: forbidden() }
		}
	}

	if (role === 'TEACHER' && ctx.completionId) {
		const completion = await prisma.stepCompletion.findUnique({
			where: { id: ctx.completionId },
			select: { studentId: true },
		})
		if (
			!completion ||
			!(await teacherCanAccessStudent(teacherId, completion.studentId))
		) {
			return { error: forbidden() }
		}
	}

	if (role === 'TEACHER' && ctx.studentId) {
		if (!(await teacherCanAccessStudent(teacherId, ctx.studentId))) {
			return { error: forbidden() }
		}
	}

	if (role === 'TEACHER' && ctx.groupId) {
		const group = await prisma.group.findUnique({ where: { id: ctx.groupId } })
		if (
			!group ||
			!(await teacherCanAccessGroupTeacher(teacherId, group.teacherId))
		) {
			return { error: forbidden() }
		}
	}

	return { session }
}
