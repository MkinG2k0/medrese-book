export type UserRole =
	| 'SUPER_ADMIN'
	| 'MANAGER'
	| 'TEACHER'
	| 'STUDENT'
	| 'ACCOUNTANT'
	| 'PARENT'

export type { Role } from '@/shared/lib/prisma'
