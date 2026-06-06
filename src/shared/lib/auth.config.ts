import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import type { UserRole } from '@/entities/user'
import { getDefaultRedirect } from '@/shared/lib/get-default-redirect'

function redirectTo(request: NextRequest, pathname: string): NextResponse {
	const url = request.nextUrl.clone()
	url.pathname = pathname
	return NextResponse.redirect(url)
}

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
			const session = auth

			if (pathname === '/login') {
				if (session?.user) {
					return redirectTo(request, getDefaultRedirect(session.user.role))
				}
				return true
			}

			if (pathname === '/' || pathname === '/dashboard') {
				if (session?.user) {
					return redirectTo(request, getDefaultRedirect(session.user.role))
				}
				return redirectTo(request, '/login')
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
					if (!session?.user) {
						return redirectTo(request, '/login')
					}
					if (!roles.includes(session.user.role)) {
						return redirectTo(request, getDefaultRedirect(session.user.role))
					}
				}
			}

			return true
		},
	},
}
