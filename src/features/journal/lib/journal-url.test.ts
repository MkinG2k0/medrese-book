import { describe, expect, it } from 'vitest'

import {
	buildJournalHref,
	resolveJournalDate,
} from '@/features/journal/lib/journal-url'

describe('resolveJournalDate', () => {
	it('returns valid date param', () => {
		expect(resolveJournalDate('2026-07-05', '2026-07-05')).toBe('2026-07-05')
	})

	it('falls back to today for invalid param', () => {
		expect(resolveJournalDate('invalid', '2026-07-05')).toBe('2026-07-05')
		expect(resolveJournalDate(null, '2026-07-05')).toBe('2026-07-05')
	})
})

describe('buildJournalHref', () => {
	it('always adds date query', () => {
		expect(buildJournalHref('/journal', '2026-07-05')).toBe(
			'/journal?date=2026-07-05',
		)
		expect(buildJournalHref('/journal', '2026-07-04')).toBe(
			'/journal?date=2026-07-04',
		)
		expect(buildJournalHref('/journal/student-id', '2026-07-04')).toBe(
			'/journal/student-id?date=2026-07-04',
		)
	})
})
