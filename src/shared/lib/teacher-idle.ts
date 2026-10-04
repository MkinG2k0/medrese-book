const encoder = new TextEncoder()

export const TEACHER_IDLE_TIMEOUT_MS = 60 * 60 * 1000

export const TEACHER_IDLE_LOGOUT_PATH = '/login?reason=idle'

export const TEACHER_IDLE_LOGOUT_CALLBACK = TEACHER_IDLE_LOGOUT_PATH

export const TEACHER_LAST_ACTIVE_COOKIE = 'teacher_last_active'

export const TEACHER_LAST_ACTIVE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export type TeacherIdleAction = 'skip' | 'allow' | 'bump' | 'expire'

export type TeacherIdleDecision = {
	action: TeacherIdleAction
	ts?: number
}

export type ShouldBumpTeacherActivityInput = {
	method: string
	pathname: string
	prefetchHeader?: string | null
	purposeHeader?: string | null
}

export type DecideTeacherIdleActionInput = {
	role: string
	userId: string
	method: string
	pathname: string
	cookieHeader: string | null
	prefetchHeader?: string | null
	purposeHeader?: string | null
	nowMs: number
	secret: string
}

export function isTeacherIdleLogoutEnabled(role: string): boolean {
	return role === 'TEACHER'
}

export function teacherLastActiveCookieOptions(secure: boolean) {
	return {
		httpOnly: true,
		path: '/',
		sameSite: 'lax' as const,
		secure,
		maxAge: TEACHER_LAST_ACTIVE_COOKIE_MAX_AGE,
	}
}

export function shouldBumpTeacherActivity(
	input: ShouldBumpTeacherActivityInput,
): boolean {
	if (input.prefetchHeader === '1' || input.purposeHeader === 'prefetch') {
		return false
	}

	const method = input.method.toUpperCase()
	if (MUTATING_METHODS.has(method)) return true
	if (method !== 'GET' && method !== 'HEAD') return false
	if (isPassiveGetPath(input.pathname)) return false
	return !input.pathname.startsWith('/api/')
}

export async function signTeacherLastActiveValue(
	userId: string,
	epochMs: number,
	secret: string,
): Promise<string> {
	const message = `${userId}.${epochMs}`
	const hmac = await hmacSha256Base64Url(secret, message)
	return `${message}.${hmac}`
}

export async function parseTeacherLastActiveValue(
	value: string | null | undefined,
	secret: string,
): Promise<{userId: string; epochMs: number} | null> {
	if (!value) return null

	const lastDot = value.lastIndexOf('.')
	if (lastDot <= 0) return null

	const hmac = value.slice(lastDot + 1)
	const message = value.slice(0, lastDot)
	const epochDot = message.lastIndexOf('.')
	if (epochDot <= 0 || !hmac) return null

	const userId = message.slice(0, epochDot)
	const epochRaw = message.slice(epochDot + 1)
	if (!userId || !/^\d+$/.test(epochRaw)) return null

	const expected = await hmacSha256Base64Url(secret, message)
	if (!timingSafeEqual(hmac, expected)) return null

	return {userId, epochMs: Number(epochRaw)}
}

export async function decideTeacherIdleAction(
	input: DecideTeacherIdleActionInput,
): Promise<TeacherIdleDecision> {
	if (input.role !== 'TEACHER') return {action: 'skip'}

	const shouldBump = shouldBumpTeacherActivity({
		method: input.method,
		pathname: input.pathname,
		prefetchHeader: input.prefetchHeader,
		purposeHeader: input.purposeHeader,
	})

	const raw = readCookieValue(input.cookieHeader, TEACHER_LAST_ACTIVE_COOKIE)
	if (!raw) {
		return {action: shouldBump ? 'bump' : 'allow'}
	}

	const parsed = await parseTeacherLastActiveValue(raw, input.secret)
	if (!parsed || parsed.userId !== input.userId) {
		return {action: 'expire'}
	}

	if (input.nowMs - parsed.epochMs >= TEACHER_IDLE_TIMEOUT_MS) {
		return {action: 'expire'}
	}

	if (shouldBump) return {action: 'bump', ts: parsed.epochMs}
	return {action: 'allow', ts: parsed.epochMs}
}

function isPassiveGetPath(pathname: string): boolean {
	if (pathname === '/api/notifications/stream') return true
	if (pathname === '/api/notifications/unread-count') return true
	if (
		pathname === '/api/conversations' ||
		pathname.startsWith('/api/conversations/')
	) {
		return true
	}
	if (
		pathname === '/api/teaching-sessions' ||
		pathname.startsWith('/api/teaching-sessions/')
	) {
		return true
	}
	if (
		pathname === '/api/auth/session' ||
		pathname.startsWith('/api/auth/session/')
	) {
		return true
	}
	return false
}

function readCookieValue(
	cookieHeader: string | null | undefined,
	name: string,
): string | null {
	if (!cookieHeader) return null

	const parts = cookieHeader.split(';')
	for (const part of parts) {
		const trimmed = part.trim()
		const eq = trimmed.indexOf('=')
		if (eq === -1) continue
		if (trimmed.slice(0, eq) === name) {
			return trimmed.slice(eq + 1)
		}
	}
	return null
}

async function hmacSha256Base64Url(
	secret: string,
	message: string,
): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{name: 'HMAC', hash: 'SHA-256'},
		false,
		['sign'],
	)
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(message),
	)
	return bytesToBase64Url(new Uint8Array(signature))
}

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = ''
	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function timingSafeEqual(left: string, right: string): boolean {
	if (left.length !== right.length) return false
	let diff = 0
	for (let i = 0; i < left.length; i++) {
		diff |= left.charCodeAt(i) ^ right.charCodeAt(i)
	}
	return diff === 0
}
