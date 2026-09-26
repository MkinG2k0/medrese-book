import type { PostType, Prisma, Role } from '@/shared/lib/prisma'

/** Prisma where fragment: STUDENT/PARENT see only GENERAL posts. */
export function postVisibilityWhere(role: Role): Prisma.PostWhereInput {
	if (role === 'STUDENT' || role === 'PARENT') {
		return { type: 'GENERAL' }
	}
	return {}
}

/** Whether a post of the given type is visible to the role. */
export function assertPostVisibleToRole(type: PostType, role: Role): boolean {
	if ((role === 'STUDENT' || role === 'PARENT') && type === 'SYSTEM') {
		return false
	}
	return true
}
