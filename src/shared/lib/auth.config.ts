import type { NextAuthConfig } from 'next-auth'

import type { UserRole } from '@/entities/user'

export const authConfig: NextAuthConfig = {
	trustHost: true,
	session: { strategy: 'jwt' },
	pages: { signIn: '/login' },
	providers: [],
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id
				token.role = user.role
				token.teacherId = user.teacherId ?? null
				token.studentId = user.studentId ?? null
			}
			return token
		},
		session({ session, token }) {
			session.user.id = token.id as string
			session.user.role = token.role as UserRole
			session.user.teacherId = (token.teacherId as string | null) ?? null
			session.user.studentId = (token.studentId as string | null) ?? null
			return session
		},
		authorized({ auth, request }) {
			const { pathname } = request.nextUrl

			if (pathname === '/login') {
				if (auth?.user) return false
				return true
			}

			const roleRoutes: Record<string, UserRole[]> = {
				'/admin': ['SUPER_ADMIN', 'MANAGER'],
				'/journal': ['TEACHER'],
				'/groups': ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
				'/analytics': ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
				'/student': ['STUDENT'],
			}

			for (const [prefix, roles] of Object.entries(roleRoutes)) {
				if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
					if (!auth?.user) return false
					return roles.includes(auth.user.role)
				}
			}

			if (pathname === '/' || pathname === '/dashboard') {
				return !!auth?.user
			}

			return true
		},
	},
}
