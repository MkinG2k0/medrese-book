import { describe, expect, it } from 'vitest'

import {
	decideTeacherIdleAction,
	isTeacherIdleLogoutEnabled,
	parseTeacherLastActiveValue,
	shouldBumpTeacherActivity,
	signTeacherLastActiveValue,
	TEACHER_IDLE_LOGOUT_CALLBACK,
	TEACHER_IDLE_TIMEOUT_MS,
	TEACHER_LAST_ACTIVE_COOKIE,
} from '@/shared/lib/teacher-idle'

const SECRET = 'test-auth-secret-for-teacher-idle'
const USER_ID = 'clteacher1userid000000001'
const NOW = 1_700_000_000_000
const FRESH_TS = NOW - 1_000
const STALE_TS = NOW - TEACHER_IDLE_TIMEOUT_MS - 1

function bumpInput(
	overrides: Partial<Parameters<typeof shouldBumpTeacherActivity>[0]> = {},
) {
	return {
		method: 'GET',
		pathname: '/journal',
		prefetchHeader: null,
		purposeHeader: null,
		...overrides,
	}
}

async function cookieHeader(
	userId: string,
	epochMs: number,
	secret = SECRET,
) {
	const value = await signTeacherLastActiveValue(userId, epochMs, secret)
	return `${TEACHER_LAST_ACTIVE_COOKIE}=${value}`
}

function decideInput(
	overrides: Partial<Parameters<typeof decideTeacherIdleAction>[0]> = {},
) {
	return {
		role: 'TEACHER',
		userId: USER_ID,
		method: 'GET',
		pathname: '/journal',
		cookieHeader: null,
		prefetchHeader: null,
		purposeHeader: null,
		nowMs: NOW,
		secret: SECRET,
		...overrides,
	}
}

describe('teacher-idle', () => {
	it('таймаут равен 1 часу', () => {
		expect(TEACHER_IDLE_TIMEOUT_MS).toBe(3_600_000)
	})

	it('включает idle logout только для учителя', () => {
		expect(isTeacherIdleLogoutEnabled('TEACHER')).toBe(true)
		expect(isTeacherIdleLogoutEnabled('MANAGER')).toBe(false)
		expect(isTeacherIdleLogoutEnabled('SUPER_ADMIN')).toBe(false)
		expect(isTeacherIdleLogoutEnabled('STUDENT')).toBe(false)
		expect(isTeacherIdleLogoutEnabled('PARENT')).toBe(false)
		expect(isTeacherIdleLogoutEnabled('ACCOUNTANT')).toBe(false)
	})

	it('callback idle logout остаётся /login?reason=idle', () => {
		expect(TEACHER_IDLE_LOGOUT_CALLBACK).toBe('/login?reason=idle')
	})

	it('sign/parse round-trip возвращает те же userId и epochMs', async () => {
		const value = await signTeacherLastActiveValue(USER_ID, FRESH_TS, SECRET)
		const parsed = await parseTeacherLastActiveValue(value, SECRET)
		expect(parsed).toEqual({ userId: USER_ID, epochMs: FRESH_TS })
	})

	describe('shouldBumpTeacherActivity', () => {
		it('GET /journal → bump', () => {
			expect(shouldBumpTeacherActivity(bumpInput())).toBe(true)
		})

		it('пассивные GET не продлевают last-active', () => {
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ pathname: '/api/notifications/stream' }),
				),
			).toBe(false)
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ pathname: '/api/notifications/unread-count' }),
				),
			).toBe(false)
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ pathname: '/api/conversations' }),
				),
			).toBe(false)
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ pathname: '/api/conversations/x/messages' }),
				),
			).toBe(false)
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ pathname: '/api/teaching-sessions' }),
				),
			).toBe(false)
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ pathname: '/api/auth/session' }),
				),
			).toBe(false)
		})

		it('POST /api/teaching-sessions → bump', () => {
			expect(
				shouldBumpTeacherActivity(
					bumpInput({
						method: 'POST',
						pathname: '/api/teaching-sessions',
					}),
				),
			).toBe(true)
		})

		it('prefetch GET /journal не bump', () => {
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ prefetchHeader: '1' }),
				),
			).toBe(false)
			expect(
				shouldBumpTeacherActivity(
					bumpInput({ purposeHeader: 'prefetch' }),
				),
			).toBe(false)
		})
	})

	describe('decideTeacherIdleAction', () => {
		it('свежая cookie + GET /journal → bump', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({ cookieHeader: await cookieHeader(USER_ID, FRESH_TS) }),
			)
			expect(result.action).toBe('bump')
		})

		it('просроченная cookie + GET /journal → expire', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({ cookieHeader: await cookieHeader(USER_ID, STALE_TS) }),
			)
			expect(result.action).toBe('expire')
		})

		it('свежая cookie + пассивные GET → allow', async () => {
			const cookie = await cookieHeader(USER_ID, FRESH_TS)
			const paths = [
				'/api/notifications/stream',
				'/api/notifications/unread-count',
				'/api/conversations',
				'/api/conversations/x/messages',
				'/api/teaching-sessions',
				'/api/auth/session',
			]
			for (const pathname of paths) {
				const result = await decideTeacherIdleAction(
					decideInput({ cookieHeader: cookie, pathname }),
				)
				expect(result.action, pathname).toBe('allow')
			}
		})

		it('свежая cookie + POST /api/teaching-sessions → bump', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({
					cookieHeader: await cookieHeader(USER_ID, FRESH_TS),
					method: 'POST',
					pathname: '/api/teaching-sessions',
				}),
			)
			expect(result.action).toBe('bump')
		})

		it('свежая cookie + GET /journal с Next-Router-Prefetch=1 → allow', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({
					cookieHeader: await cookieHeader(USER_ID, FRESH_TS),
					prefetchHeader: '1',
				}),
			)
			expect(result.action).toBe('allow')
		})

		it('просроченная cookie + GET unread-count → expire', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({
					cookieHeader: await cookieHeader(USER_ID, STALE_TS),
					pathname: '/api/notifications/unread-count',
				}),
			)
			expect(result.action).toBe('expire')
		})

		it('невалидный HMAC → expire', async () => {
			const valid = await signTeacherLastActiveValue(USER_ID, FRESH_TS, SECRET)
			const tampered = `${valid.slice(0, -1)}${valid.endsWith('a') ? 'b' : 'a'}`
			const result = await decideTeacherIdleAction(
				decideInput({
					cookieHeader: `${TEACHER_LAST_ACTIVE_COOKIE}=${tampered}`,
				}),
			)
			expect(result.action).toBe('expire')
		})

		it('userId mismatch → expire', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({
					cookieHeader: await cookieHeader('other-user-id', FRESH_TS),
				}),
			)
			expect(result.action).toBe('expire')
		})

		it('нет cookie + GET /journal → bump (initialize)', async () => {
			const result = await decideTeacherIdleAction(decideInput())
			expect(result.action).toBe('bump')
		})

		it('нет cookie + пассивный GET → allow (не выставлять)', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({ pathname: '/api/notifications/unread-count' }),
			)
			expect(result.action).toBe('allow')
		})

		it('MANAGER → skip независимо от cookie', async () => {
			const result = await decideTeacherIdleAction(
				decideInput({
					role: 'MANAGER',
					cookieHeader: await cookieHeader(USER_ID, STALE_TS),
				}),
			)
			expect(result.action).toBe('skip')
		})
	})
})
