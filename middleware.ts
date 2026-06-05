import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

import type { UserRole } from '@/entities/user'
import { authConfig } from '@/shared/lib/auth.config'

const { auth } = NextAuth(authConfig)

function getDefaultRedirect(role: UserRole): string {
	switch (role) {
		case 'TEACHER':
			return '/journal'
		case 'STUDENT':
			return '/student/me'
		case 'MANAGER':
		case 'SUPER_ADMIN':
			return '/admin/users'
		default:
			return '/dashboard'
	}
}

export default auth((req) => {
	const { pathname } = req.nextUrl
	const session = req.auth

	if (pathname === '/login' && session?.user) {
		return NextResponse.redirect(new URL(getDefaultRedirect(session.user.role), req.url))
	}

	if ((pathname === '/' || pathname === '/dashboard') && session?.user) {
		return NextResponse.redirect(new URL(getDefaultRedirect(session.user.role), req.url))
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
			if (!session) {
				return NextResponse.redirect(new URL('/login', req.url))
			}
			if (!roles.includes(session.user.role)) {
				return NextResponse.redirect(new URL(getDefaultRedirect(session.user.role), req.url))
			}
		}
	}

	return NextResponse.next()
})

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|robots.txt|icons|uploads|api/auth).*)',
	],
}
