import { describe, expect, it } from 'vitest'

import { shouldShowOnlyCompletedLessonSteps } from '@/features/journal/lib/lesson-view-mode'
import { getLocalDateString } from '@/shared/lib/calendar-date'

describe('shouldShowOnlyCompletedLessonSteps', () => {
	const today = getLocalDateString()

	it('returns true for past dates', () => {
		expect(
			shouldShowOnlyCompletedLessonSteps('2020-01-01', null),
		).toBe(true)
	})

	it('returns true when teaching session is ended', () => {
		expect(
			shouldShowOnlyCompletedLessonSteps(today, {
				endedAt: `${today}T12:00:00.000Z`,
			}),
		).toBe(true)
	})

	it('returns false for today with active or missing teaching session', () => {
		expect(shouldShowOnlyCompletedLessonSteps(today, null)).toBe(false)
		expect(
			shouldShowOnlyCompletedLessonSteps(today, { endedAt: null }),
		).toBe(false)
	})
})
