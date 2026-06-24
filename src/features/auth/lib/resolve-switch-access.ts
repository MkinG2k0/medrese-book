import type { Session } from 'next-auth'

import type { UserRole } from '@/entities/user'
import { prisma } from '@/shared/lib/prisma'

import { canSwitchUser } from './can-switch-user'

export type SwitchAccess = {
	allowed: boolean
	switchOwnerId: string | null
}

export async function resolveSwitchAccess(
	session: Session,
): Promise<SwitchAccess> {
	if (canSwitchUser(session.user.role)) {
		return { allowed: true, switchOwnerId: session.user.id }
	}

	const switchOwnerId = session.user.switchOwnerId
	if (!switchOwnerId) {
		return { allowed: false, switchOwnerId: null }
	}

	const owner = await prisma.user.findUnique({
		where: { id: switchOwnerId },
		select: { role: true },
	})

	if (!owner || !canSwitchUser(owner.role as UserRole)) {
		return { allowed: false, switchOwnerId: null }
	}

	return { allowed: true, switchOwnerId }
}
