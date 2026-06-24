import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import type { UserRole } from '@/entities/user'
import { getDefaultRedirect } from '@/shared/lib/get-default-redirect'

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

function redirectTo(request: NextRequest, pathname: string): NextResponse {
	const url = request.nextUrl.clone()
	url.pathname = pathname
	return NextResponse.redirect(url)
}

export const authConfig: NextAuthConfig = {
	trustHost: true,
	secret: authSecret,
	session: {strategy: 'jwt'},
	pages: {signIn: '/login'},
	providers: [],
	callbacks: {
		jwt({token, user}) {
			if (user) {
				token.id = user.id
				token.role = user.role
				token.teacherId = user.teacherId ?? null
				token.studentId = user.studentId ?? null
				token.switchOwnerId = user.switchOwnerId ?? null
			}
			return token
		},
		session({session, token}) {
			session.user.id = token.id as string
			session.user.role = token.role as UserRole
			session.user.teacherId = (token.teacherId as string | null) ?? null
			session.user.studentId = (token.studentId as string | null) ?? null
			session.user.switchOwnerId =
				(token.switchOwnerId as string | null) ?? null
			return session
		},
		authorized({auth, request}) {
			const {pathname} = request.nextUrl
			const session = auth

			if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
				if (!session?.user) {
					return NextResponse.json(
						{data: null, error: 'Требуется авторизация'},
						{status: 401},
					)
				}
				return true
			}

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
				'/calendar': ['TEACHER'],
				'/journal': ['TEACHER'],
				'/my-group': ['TEACHER'],
				'/groups': ['MANAGER', 'SUPER_ADMIN'],
				'/analytics/teachers': ['MANAGER', 'SUPER_ADMIN'],
				'/analytics': ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
				'/student': ['STUDENT'],
			}

			const sortedRoutes = Object.entries(roleRoutes).sort(
				([a], [b]) => b.length - a.length,
			)

			for (const [prefix, roles] of sortedRoutes) {
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
