import { describe, expect, it } from 'vitest'

import { resolveTeachingSessionStart } from '@/features/journal/lib/teaching-session-start'

describe('resolveTeachingSessionStart', () => {
	it('creates when no session exists', () => {
		expect(resolveTeachingSessionStart(null)).toEqual({ action: 'create' })
	})

	it('resumes active session', () => {
		const session = { endedAt: null }
		expect(resolveTeachingSessionStart(session)).toEqual({
			action: 'resume',
			session,
		})
	})

	it('rejects completed session', () => {
		expect(
			resolveTeachingSessionStart({ endedAt: new Date('2026-06-25T13:00:00Z') }),
		).toEqual({ action: 'already_ended' })
	})

	it('does not treat null existing as already started', () => {
		const result = resolveTeachingSessionStart(null)
		expect(result.action).not.toBe('resume')
	})
})
