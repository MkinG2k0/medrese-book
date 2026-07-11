import { describe, expect, it } from 'vitest'

import {
	buildJournalHref,
	resolveJournalDate,
	resolveJournalGroupId,
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

	it('includes groupId when provided', () => {
		expect(buildJournalHref('/journal', '2026-07-05', 'g1')).toBe(
			'/journal?date=2026-07-05&groupId=g1',
		)
	})
})

describe('resolveJournalGroupId', () => {
	it('returns param when in allowedIds', () => {
		expect(resolveJournalGroupId('g1', ['g1', 'g2'], 'g2')).toBe('g1')
	})

	it('falls back when param is null', () => {
		expect(resolveJournalGroupId(null, ['g1', 'g2'], 'g2')).toBe('g2')
	})

	it('falls back when param is not in allowedIds', () => {
		expect(resolveJournalGroupId('invalid', ['g1'], 'g1')).toBe('g1')
	})
})
