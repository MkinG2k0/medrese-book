import 'next-auth'
import 'next-auth/jwt'

import type { UserRole } from '@/entities/user'

declare module 'next-auth' {
	interface User {
		role: UserRole
		teacherId: number | null
	}

	interface Session {
		user: {
			id: string
			name: string
			role: UserRole
			teacherId: number | null
		}
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id?: string
		role?: UserRole
		teacherId?: number | null
	}
}
