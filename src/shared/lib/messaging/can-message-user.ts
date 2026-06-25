import type { Session } from 'next-auth'

import { canAccessGroupAsTeacher } from '@/shared/lib/group-access'
import { prisma } from '@/shared/lib/prisma'

export function sortParticipantIds(
	userIdA: string,
	userIdB: string,
): [string, string] {
	return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA]
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
			student: { include: { group: true } },
		},
	})
	if (!target || target.role === 'SUPER_ADMIN') return false

	const { role, teacherId, studentId } = session.user

	if (role === 'MANAGER') {
		return target.role === 'TEACHER' || target.role === 'STUDENT'
	}

	if (role === 'TEACHER') {
		if (target.role === 'MANAGER') return true
		if (target.role === 'STUDENT' && target.student) {
			return canAccessGroupAsTeacher(
				teacherId,
				target.student.group.teacherId,
			)
		}
		return false
	}

	if (role === 'STUDENT') {
		if (target.role === 'MANAGER') return true
		if (target.role === 'TEACHER' && target.teacher && studentId) {
			const student = await prisma.student.findUnique({
				where: { id: studentId },
				select: { group: { select: { teacherId: true } } },
			})
			return student?.group.teacherId === target.teacher.id
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

		const [managers, students] = await Promise.all([
			prisma.user.findMany({
				where: { role: 'MANAGER' },
				select: { id: true, name: true, role: true },
				orderBy: { name: 'asc' },
			}),
			accessibleTeacherIds.length > 0
				? prisma.user.findMany({
						where: {
							role: 'STUDENT',
							student: {
								group: { teacherId: { in: accessibleTeacherIds } },
							},
						},
						select: { id: true, name: true, role: true },
						orderBy: { name: 'asc' },
					})
				: Promise.resolve([]),
		])
		return [...managers, ...students]
	}

	if (role === 'STUDENT' && studentId) {
		const student = await prisma.student.findUnique({
			where: { id: studentId },
			include: {
				group: { include: { teacher: { include: { user: true } } } },
			},
		})
		if (!student) return []

		const managers = await prisma.user.findMany({
			where: { role: 'MANAGER' },
			select: { id: true, name: true, role: true },
			orderBy: { name: 'asc' },
		})

		const teacherUser = student.group.teacher.user
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
