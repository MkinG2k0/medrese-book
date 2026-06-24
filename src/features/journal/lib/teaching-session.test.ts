import { describe, expect, it } from 'vitest'

import {
	formatTeachingSessionDurationLabel,
	getTeachingSessionDurationMs,
	serializeTeachingSession,
} from '@/features/journal/lib/teaching-session'

describe('getTeachingSessionDurationMs', () => {
	it('returns null for active session', () => {
		expect(
			getTeachingSessionDurationMs({
				startedAt: new Date('2026-06-25T10:00:00Z'),
				endedAt: null,
			}),
		).toBeNull()
	})

	it('keeps second precision for short lessons', () => {
		expect(
			getTeachingSessionDurationMs({
				startedAt: new Date('2026-06-25T10:00:00Z'),
				endedAt: new Date('2026-06-25T10:00:45Z'),
			}),
		).toBe(45_000)
	})
})

describe('serializeTeachingSession', () => {
	it('does not round short lessons down to zero minutes', () => {
		const dto = serializeTeachingSession({
			id: 's1',
			teacherId: 't1',
			groupId: 'g1',
			date: new Date('2026-06-25T12:00:00Z'),
			startedAt: new Date('2026-06-25T10:00:00Z'),
			endedAt: new Date('2026-06-25T10:04:30Z'),
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		expect(dto.durationMs).toBe(270_000)
		expect(dto.durationMinutes).toBe(5)
	})
})

describe('formatTeachingSessionDurationLabel', () => {
	const endedSession = {
		startedAt: '2026-06-25T10:00:00.000Z',
		endedAt: '2026-06-25T10:04:30.000Z',
		durationMs: 270_000,
		isActive: false,
	}

	it('formats completed lesson duration', () => {
		expect(formatTeachingSessionDurationLabel(endedSession)).toBe('4:30')
	})

	it('returns fallback when session is missing', () => {
		expect(formatTeachingSessionDurationLabel(null)).toBe('время не учтено')
	})

	it('returns fallback when lesson was not ended', () => {
		expect(
			formatTeachingSessionDurationLabel({
				...endedSession,
				endedAt: null,
				isActive: true,
			}),
		).toBe('время не учтено')
	})

	it('returns fallback when duration is zero', () => {
		expect(
			formatTeachingSessionDurationLabel({
				startedAt: '2026-06-25T10:00:00.000Z',
				endedAt: '2026-06-25T10:00:00.000Z',
				durationMs: 0,
				isActive: false,
			}),
		).toBe('время не учтено')
	})
})
