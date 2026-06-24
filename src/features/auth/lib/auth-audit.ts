import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import type { UserRole } from '@/entities/user'

export async function recordUserLogin(
	userId: string,
	role: UserRole,
	meta?: { switchOwnerId?: string | null },
) {
	await dispatchDomainEvent({
		actorId: userId,
		action: 'USER_LOGIN',
		entityType: 'User',
		entityId: userId,
		payload: {
			role,
			loggedInAt: new Date().toISOString(),
			...(meta?.switchOwnerId ? { switchOwnerId: meta.switchOwnerId } : {}),
		},
	})
}

export async function recordUserLogout(userId: string, role: UserRole) {
	await dispatchDomainEvent({
		actorId: userId,
		action: 'USER_LOGOUT',
		entityType: 'User',
		entityId: userId,
		payload: {
			role,
			loggedOutAt: new Date().toISOString(),
		},
	})
}
