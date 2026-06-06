import type { UserRole } from '@/entities/user'

export function canSwitchUser(role: UserRole) {
	return (
		process.env.NODE_ENV === 'development' ||
		role === 'SUPER_ADMIN' ||
		role === 'MANAGER'
	)
}
