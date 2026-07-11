import { forbidden, unauthorized } from '@/shared/api'
import { auth } from '@/shared/lib/auth'
import {
	getStudentGroupTeacherIds,
} from '@/shared/lib/enrollment'
import { prisma } from '@/shared/lib/prisma'
import { canSubstituteAccessGroup } from '@/shared/lib/substitution-access'

async function teacherCanAccessStudentGroup(
	teacherId: string | null,
	groupTeacherId: string,
): Promise<boolean> {
	if (!teacherId) return false
	if (teacherId === groupTeacherId) return true
	return canSubstituteAccessGroup(teacherId, groupTeacherId)
}

async function teacherCanAccessStudent(
	teacherId: string | null,
	studentId: string,
): Promise<boolean> {
	const groupTeacherIds = await getStudentGroupTeacherIds(studentId)
	for (const groupTeacherId of groupTeacherIds) {
		if (await teacherCanAccessStudentGroup(teacherId, groupTeacherId)) {
			return true
		}
	}
	return false
}

export async function authorizeTeacherStudent(studentId: string) {
	const session = await auth()
	if (!session) return { error: unauthorized() } as const
	if (session.user.role !== 'TEACHER') return { error: forbidden() } as const

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: { user: true },
	})

	if (!student) return { error: null, student: null } as const

	const allowed = await teacherCanAccessStudent(
		session.user.teacherId,
		studentId,
	)
	if (!allowed) {
		return { error: forbidden() } as const
	}

	return { error: null, student } as const
}

export async function authorizeTeacherCompletion(completionId: string) {
	const session = await auth()
	if (!session) return { error: unauthorized() } as const
	if (session.user.role !== 'TEACHER') return { error: forbidden() } as const

	const completion = await prisma.stepCompletion.findUnique({
		where: { id: completionId },
		include: {
			student: { include: { user: true } },
			step: true,
			session: true,
		},
	})

	if (!completion) return { error: null, completion: null } as const

	const allowed = await teacherCanAccessStudent(
		session.user.teacherId,
		completion.studentId,
	)
	if (!allowed) {
		return { error: forbidden() } as const
	}

	return { error: null, completion } as const
}
