import type { UserRole } from '@/entities/user'

/** 1 час бездействия — только для роли TEACHER */
export const TEACHER_IDLE_TIMEOUT_MS = 60 * 60 * 1000

export const TEACHER_IDLE_LOGOUT_CALLBACK = '/login?reason=idle'

export function isTeacherIdleLogoutEnabled(role: UserRole): boolean {
	return role === 'TEACHER'
}
