import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { unauthorizedIdle } from '@/shared/api'
import { auth, signOut } from '@/shared/lib/auth'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import {
	TEACHER_IDLE_LOGOUT_PATH,
	TEACHER_LAST_ACTIVE_COOKIE,
	teacherLastActiveCookieOptions,
} from '@/shared/lib/teacher-idle'
import { recordUserLogout } from '@/features/auth/lib/auth-audit'
import { findActiveTeachingSession } from '@/features/journal/lib/teaching-session-queries'

export const runtime = 'nodejs'

type SignOutCookie = {
	name: string
	value: string
	options?: Parameters<NextResponse['cookies']['set']>[2]
}

async function handleIdleExpire(request: NextRequest) {
	const session = await auth()
	const from = request.nextUrl.searchParams.get('from') ?? ''

	if (session?.user) {
		if (session.user.role === 'TEACHER' && session.user.teacherId) {
			try {
				await endActiveLessonForIdle(
					session.user.id,
					session.user.teacherId,
				)
			} catch {
				// logout must proceed even if lesson end fails
			}
		}

		try {
			await recordUserLogout(session.user.id, session.user.role)
		} catch {
			// ignore audit failures on idle logout
		}

		const signOutResult = await signOut({redirect: false})
		const response = idleExpireResponse(request, from)
		applySignOutCookies(response, signOutResult)
		clearTeacherLastActiveCookie(response, request)
		return response
	}

	const response = idleExpireResponse(request, from)
	clearTeacherLastActiveCookie(response, request)
	return response
}

async function endActiveLessonForIdle(actorId: string, teacherId: string) {
	const active = await findActiveTeachingSession(teacherId)
	if (!active) return

	const endedAt = new Date()
	await prisma.$transaction(async (tx) => {
		const updated = await tx.teachingSession.update({
			where: {id: active.id},
			data: {endedAt},
		})

		await dispatchDomainEvent(
			{
				actorId,
				action: 'LESSON_ENDED',
				entityType: 'TeachingSession',
				entityId: updated.id,
				payload: {
					groupId: updated.groupId,
					startedAt: updated.startedAt.toISOString(),
					endedAt: endedAt.toISOString(),
					durationMinutes: Math.ceil(
						(endedAt.getTime() - updated.startedAt.getTime()) / 60_000,
					),
					reason: 'idle',
				},
			},
			tx,
		)
	})
}

function idleExpireResponse(_request: NextRequest, from: string) {
	if (from.startsWith('/api/')) {
		return unauthorizedIdle()
	}

	// Relative Location: browser resolves against the client-facing origin
	// (localhost / public host), not the server bind address (e.g. 0.0.0.0).
	return new NextResponse(null, {
		status: 307,
		headers: {Location: TEACHER_IDLE_LOGOUT_PATH},
	})
}

function clearTeacherLastActiveCookie(
	response: NextResponse,
	request: NextRequest,
) {
	response.cookies.set(TEACHER_LAST_ACTIVE_COOKIE, '', {
		...teacherLastActiveCookieOptions(request.nextUrl.protocol === 'https:'),
		maxAge: 0,
	})
}

function applySignOutCookies(response: NextResponse, signOutResult: unknown) {
	if (!signOutResult || typeof signOutResult !== 'object') return

	const cookies = (signOutResult as {cookies?: SignOutCookie[]}).cookies
	if (!Array.isArray(cookies)) return

	for (const cookie of cookies) {
		if (!cookie?.name) continue
		response.cookies.set(cookie.name, cookie.value, cookie.options)
	}
}

export const GET = handleIdleExpire
export const POST = handleIdleExpire
export const PUT = handleIdleExpire
export const PATCH = handleIdleExpire
export const DELETE = handleIdleExpire
