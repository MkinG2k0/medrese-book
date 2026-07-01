import { describe, expect, it } from 'vitest'

import { collectTeachingSessionCalendarDays } from '@/features/journal/lib/teaching-session-calendar-days'

describe('collectTeachingSessionCalendarDays', () => {
	it('returns unique sorted days within range', () => {
		const sessions = [
			{
				date: new Date('2026-06-10T12:00:00.000Z'),
				startedAt: new Date('2026-06-10T09:00:00.000Z'),
			},
			{
				date: new Date('2026-06-12T12:00:00.000Z'),
				startedAt: new Date('2026-06-12T09:00:00.000Z'),
			},
		]

		expect(
			collectTeachingSessionCalendarDays(sessions, '2026-06-01', '2026-06-30'),
		).toEqual(['2026-06-10', '2026-06-12'])
	})

	it('excludes days outside requested range', () => {
		const sessions = [
			{
				date: new Date('2026-06-01T12:00:00.000Z'),
				startedAt: new Date('2026-06-01T09:00:00.000Z'),
			},
		]

		expect(
			collectTeachingSessionCalendarDays(sessions, '2026-06-10', '2026-06-30'),
		).toEqual([])
	})

	it('includes startedAt day when it differs from stored date', () => {
		const sessions = [
			{
				date: new Date('2026-06-11T12:00:00.000Z'),
				startedAt: new Date('2026-06-10T21:00:00.000Z'),
			},
		]

		expect(
			collectTeachingSessionCalendarDays(sessions, '2026-06-01', '2026-06-30'),
		).toEqual(['2026-06-11'])
	})
})
