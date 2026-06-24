import type { UserRole } from '@/entities/user'

export function canSwitchUser(role: UserRole) {
	return role === 'SUPER_ADMIN' || role === 'MANAGER'
}
