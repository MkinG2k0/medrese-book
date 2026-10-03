import type { Role } from '@/shared/lib/prisma'

export const MESSAGING_ROLES = [
	'TEACHER',
	'MANAGER',
	'STUDENT',
	'ACCOUNTANT',
	'PARENT',
] as const satisfies readonly Role[]
