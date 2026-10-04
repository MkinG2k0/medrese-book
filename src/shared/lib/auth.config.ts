import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import type { UserRole } from '@/entities/user'
import { getDefaultRedirect } from '@/shared/lib/get-default-redirect'
import { matchRoleRouteAccess } from '@/shared/lib/match-role-route'
import {
	decideTeacherIdleAction,
	signTeacherLastActiveValue,
	TEACHER_LAST_ACTIVE_COOKIE,
	teacherLastActiveCookieOptions,
	type TeacherIdleAction,
} from '@/shared/lib/teacher-idle'

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

function redirectTo(request: NextRequest, pathname: string): NextResponse {
	const url = request.nextUrl.clone()
	url.pathname = pathname
	return NextResponse.redirect(url)
}

function rewriteIdleExpire(request: NextRequest, fromPath: string): NextResponse {
	const url = request.nextUrl.clone()
	url.pathname = '/api/auth/idle-expire'
	url.search = ''
	url.searchParams.set('from', fromPath)
	return NextResponse.rewrite(url)
}

async function withTeacherIdleCookie(
	request: NextRequest,
	result: boolean | NextResponse,
	action: TeacherIdleAction,
	userId: string | undefined,
): Promise<boolean | NextResponse> {
	if (action !== 'bump' && action !== 'allow') return result

	const response = result instanceof NextResponse ? result : NextResponse.next()
	if (action === 'bump' && userId && authSecret) {
		const value = await signTeacherLastActiveValue(
			userId,
			Date.now(),
			authSecret,
		)
		response.cookies.set(
			TEACHER_LAST_ACTIVE_COOKIE,
			value,
			teacherLastActiveCookieOptions(request.nextUrl.protocol === 'https:'),
		)
	}
	return response
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
		async authorized({auth, request}) {
			const {pathname} = request.nextUrl
			const session = auth
			const isApi =
				pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')

			if (isApi && pathname.startsWith('/api/internal/cron')) {
				return true
			}
			if (isApi && !session?.user) {
				return NextResponse.json(
					{data: null, error: 'Требуется авторизация'},
					{status: 401},
				)
			}

			let idleAction: TeacherIdleAction = 'skip'
			if (session?.user) {
				const idle = await decideTeacherIdleAction({
					role: session.user.role,
					userId: session.user.id,
					method: request.method,
					pathname,
					cookieHeader: request.headers.get('cookie'),
					prefetchHeader: request.headers.get('next-router-prefetch'),
					purposeHeader: request.headers.get('purpose'),
					nowMs: Date.now(),
					secret: authSecret ?? '',
				})
				idleAction = idle.action
				if (idle.action === 'expire') {
					return rewriteIdleExpire(request, pathname)
				}
			}

			const done = (result: boolean | NextResponse) =>
				withTeacherIdleCookie(
					request,
					result,
					idleAction,
					session?.user?.id,
				)

			if (isApi) {
				return done(true)
			}

			if (pathname === '/login') {
				if (session?.user) {
					return done(redirectTo(request, getDefaultRedirect(session.user.role)))
				}
				return true
			}

			if (pathname === '/' || pathname === '/dashboard') {
				if (session?.user) {
					return done(redirectTo(request, getDefaultRedirect(session.user.role)))
				}
				return redirectTo(request, '/login')
			}

			const decision = matchRoleRouteAccess(pathname, session?.user?.role)
			if (decision === 'login') {
				return redirectTo(request, '/login')
			}
			if (decision === 'deny' && session?.user) {
				return done(redirectTo(request, getDefaultRedirect(session.user.role)))
			}

			return done(true)
		},
	},
}
