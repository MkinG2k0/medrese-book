import type { Session } from 'next-auth'

import type { UserRole } from '@/entities/user'
import { prisma } from '@/shared/lib/prisma'
import {
	canSubstituteAccessGroup,
	getActiveSubstitutionsForSubstitute,
} from '@/shared/lib/substitution-access'

export type SwitchAccess = {
	allowed: boolean
	switchOwnerId: string | null
}

async function teacherHasActiveSubstitution(teacherId: string): Promise<boolean> {
	const active = await getActiveSubstitutionsForSubstitute(teacherId)
	return active.length > 0
}

export async function isPrivilegedSwitchOwner(
	switchOwnerId: string,
): Promise<boolean> {
	const owner = await prisma.user.findUnique({
		where: { id: switchOwnerId },
		select: { role: true },
	})

	return owner?.role === 'SUPER_ADMIN' || owner?.role === 'MANAGER'
}

async function isValidTeacherSwitchSession(session: Session): Promise<boolean> {
	const switchOwnerId = session.user.switchOwnerId
	if (!switchOwnerId || !session.user.teacherId) {
		return false
	}

	const owner = await prisma.user.findUnique({
		where: { id: switchOwnerId },
		select: { teacher: { select: { id: true } } },
	})

	if (!owner?.teacher?.id) {
		return false
	}

	return canSubstituteAccessGroup(owner.teacher.id, session.user.teacherId)
}

export async function resolveSwitchAccess(
	session: Session,
): Promise<SwitchAccess> {
	const role = session.user.role as UserRole

	if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
		return { allowed: true, switchOwnerId: session.user.id }
	}

	if (role === 'ACCOUNTANT') {
		if (
			session.user.switchOwnerId &&
			(await isPrivilegedSwitchOwner(session.user.switchOwnerId))
		) {
			return {
				allowed: true,
				switchOwnerId: session.user.switchOwnerId,
			}
		}

		return { allowed: true, switchOwnerId: session.user.id }
	}

	if (role === 'TEACHER') {
		const teacherId = session.user.teacherId
		if (!teacherId) {
			return { allowed: false, switchOwnerId: null }
		}

		if (session.user.switchOwnerId) {
			if (await isPrivilegedSwitchOwner(session.user.switchOwnerId)) {
				return {
					allowed: true,
					switchOwnerId: session.user.switchOwnerId,
				}
			}

			const valid = await isValidTeacherSwitchSession(session)
			if (valid) {
				return {
					allowed: true,
					switchOwnerId: session.user.switchOwnerId,
				}
			}
			return { allowed: false, switchOwnerId: null }
		}

		if (await teacherHasActiveSubstitution(teacherId)) {
			return { allowed: true, switchOwnerId: session.user.id }
		}

		return { allowed: false, switchOwnerId: null }
	}

	return { allowed: false, switchOwnerId: null }
}
