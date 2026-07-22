import type { UserRole } from '@/entities/user'

export type RoleRouteDecision = 'allow' | 'deny' | 'login' | 'none'

export const ROLE_ROUTES: Record<string, UserRole[]> = {
	'/admin': ['SUPER_ADMIN', 'MANAGER'],
	'/admin/leave-calendar': ['SUPER_ADMIN', 'MANAGER'],
	'/calendar': ['TEACHER'],
	'/journal': ['TEACHER'],
	'/extra-assignments': ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	'/my-group': ['TEACHER'],
	'/groups': ['MANAGER', 'SUPER_ADMIN'],
	'/analytics/teachers': ['MANAGER', 'SUPER_ADMIN'],
	'/analytics/my-hours': ['TEACHER'],
	'/analytics': ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	'/accounting': ['ACCOUNTANT'],
	'/accounting/my-salary': ['TEACHER'],
	'/student': ['STUDENT'],
	'/messages': ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
	'/help': ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
}

/**
 * Longest-prefix match against ROLE_ROUTES.
 * On first matching prefix: returns allow/deny/login and stops (no parent fall-through).
 * No match → none.
 */
export function matchRoleRouteAccess(
	pathname: string,
	role: UserRole | undefined,
): RoleRouteDecision {
	const sortedRoutes = Object.entries(ROLE_ROUTES).sort(
		([a], [b]) => b.length - a.length,
	)

	for (const [prefix, roles] of sortedRoutes) {
		if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
			if (!role) {
				return 'login'
			}
			if (!roles.includes(role)) {
				return 'deny'
			}
			return 'allow'
		}
	}

	return 'none'
}
