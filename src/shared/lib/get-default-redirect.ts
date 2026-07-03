import type { UserRole } from '@/entities/user'

export function getDefaultRedirect(role: UserRole): string {
	switch (role) {
		case 'TEACHER':
			return '/journal'
		case 'STUDENT':
			return '/student/me'
		case 'MANAGER':
		case 'SUPER_ADMIN':
			return '/admin/users'
		case 'ACCOUNTANT':
			return '/accounting'
		default:
			return '/dashboard'
	}
}
