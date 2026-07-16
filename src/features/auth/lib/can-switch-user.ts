import type { UserRole } from '@/entities/user'

export function canSwitchUser(role: UserRole, switchOwnerId?: string | null) {
	return (
		role === 'SUPER_ADMIN' ||
		role === 'MANAGER' ||
		role === 'ACCOUNTANT' ||
		!!switchOwnerId
	)
}
