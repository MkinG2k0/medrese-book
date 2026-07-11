import type { Session } from 'next-auth'

import {
	findPrimaryEnrollment,
	getStudentGroupTeacherIds,
} from '@/shared/lib/enrollment'
import { canAccessGroupAsTeacher } from '@/shared/lib/group-access'
import { prisma } from '@/shared/lib/prisma'

export function sortParticipantIds(
	userIdA: string,
	userIdB: string,
): [string, string] {
	return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA]
}

async function teacherCanAccessStudent(
	teacherId: string | null,
	studentId: string,
): Promise<boolean> {
	const groupTeacherIds = await getStudentGroupTeacherIds(studentId)
	for (const groupTeacherId of groupTeacherIds) {
		if (await canAccessGroupAsTeacher(teacherId, groupTeacherId)) {
			return true
		}
	}
	return false
}

export async function canMessageUser(
	session: Session,
	targetUserId: string,
): Promise<boolean> {
	if (session.user.role === 'SUPER_ADMIN') return false
	if (session.user.id === targetUserId) return false

	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		include: {
			teacher: true,
			student: true,
		},
	})
	if (!target || target.role === 'SUPER_ADMIN') return false

	const { role, teacherId, studentId } = session.user

	if (role === 'MANAGER') {
		return target.role === 'TEACHER' || target.role === 'STUDENT'
	}

	if (role === 'TEACHER') {
		if (target.role === 'MANAGER') return true
		if (target.role === 'TEACHER') return true
		if (target.role === 'STUDENT' && target.student) {
			return teacherCanAccessStudent(teacherId, target.student.id)
		}
		return false
	}

	if (role === 'STUDENT') {
		if (target.role === 'MANAGER') return true
		if (target.role === 'TEACHER' && target.teacher && studentId) {
			const enrollment = await findPrimaryEnrollment(studentId)
			return enrollment?.group.teacherId === target.teacher.id
		}
		return false
	}

	return false
}

export async function getMessageableContacts(session: Session) {
	const { role, teacherId, studentId } = session.user

	if (role === 'SUPER_ADMIN') return []

	if (role === 'MANAGER') {
		return prisma.user.findMany({
			where: { role: { in: ['TEACHER', 'STUDENT'] } },
			select: { id: true, name: true, role: true },
			orderBy: [{ role: 'asc' }, { name: 'asc' }],
		})
	}

	if (role === 'TEACHER') {
		const accessibleTeacherIds = teacherId
			? await getGroupTeacherIdsForTeacher(teacherId)
			: []

		const [managers, teachers, students] = await Promise.all([
			prisma.user.findMany({
				where: { role: 'MANAGER' },
				select: { id: true, name: true, role: true },
				orderBy: { name: 'asc' },
			}),
			prisma.user.findMany({
				where: {
					role: 'TEACHER',
					id: { not: session.user.id },
				},
				select: { id: true, name: true, role: true },
				orderBy: { name: 'asc' },
			}),
			accessibleTeacherIds.length > 0
				? prisma.user.findMany({
						where: {
							role: 'STUDENT',
							student: {
								enrollments: {
									some: {
										group: { teacherId: { in: accessibleTeacherIds } },
									},
								},
							},
						},
						select: { id: true, name: true, role: true },
						orderBy: { name: 'asc' },
					})
				: Promise.resolve([]),
		])
		return [...managers, ...teachers, ...students]
	}

	if (role === 'STUDENT' && studentId) {
		const enrollment = await findPrimaryEnrollment(studentId)
		if (!enrollment) return []

		const managers = await prisma.user.findMany({
			where: { role: 'MANAGER' },
			select: { id: true, name: true, role: true },
			orderBy: { name: 'asc' },
		})

		const teacherUser = enrollment.group.teacher.user
		return [
			{ id: teacherUser.id, name: teacherUser.name, role: teacherUser.role },
			...managers,
		]
	}

	return []
}

async function getGroupTeacherIdsForTeacher(
	teacherId: string,
): Promise<string[]> {
	const substitutions = await prisma.substitution.findMany({
		where: { substituteTeacherId: teacherId, isActive: true },
		select: { absentTeacherId: true },
	})

	return [
		...new Set([teacherId, ...substitutions.map((s) => s.absentTeacherId)]),
	]
}

export async function userInConversation(
	conversation: { participant1Id: string; participant2Id: string },
	userId: string,
): Promise<boolean> {
	return (
		conversation.participant1Id === userId ||
		conversation.participant2Id === userId
	)
}

export async function canViewConversation(
	session: Session,
	conversationId: string,
): Promise<boolean> {
	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
		include: {
			participant1: { select: { id: true, role: true } },
			participant2: { select: { id: true, role: true } },
		},
	})
	if (!conversation) return false

	if (await userInConversation(conversation, session.user.id)) return true

	if (session.user.role === 'MANAGER') {
		return (
			conversation.participant1.role === 'TEACHER' ||
			conversation.participant2.role === 'TEACHER'
		)
	}

	return false
}
