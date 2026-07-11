import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	JOURNAL_GROUP_STORAGE_KEY,
	JOURNAL_HISTORY_GROUP_STORAGE_KEY,
	readJournalGroupId,
	writeJournalGroupId,
} from '@/features/journal/lib/journal-storage'

describe('journal-storage', () => {
	afterEach(() => {
		localStorage.clear()
	})

	it('exports separate keys for journal and history', () => {
		expect(JOURNAL_GROUP_STORAGE_KEY).toBe('journal:lastGroupId')
		expect(JOURNAL_HISTORY_GROUP_STORAGE_KEY).toBe('journal:history:lastGroupId')
	})

	it('reads and writes groupId', () => {
		writeJournalGroupId(JOURNAL_GROUP_STORAGE_KEY, 'g1')
		expect(readJournalGroupId(JOURNAL_GROUP_STORAGE_KEY)).toBe('g1')
	})

	it('returns null when key is missing', () => {
		expect(readJournalGroupId(JOURNAL_GROUP_STORAGE_KEY)).toBeNull()
	})

	it('returns null on SSR', () => {
		const windowSpy = vi.spyOn(globalThis, 'window', 'get')
		windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis)

		expect(readJournalGroupId(JOURNAL_GROUP_STORAGE_KEY)).toBeNull()

		writeJournalGroupId(JOURNAL_GROUP_STORAGE_KEY, 'g1')

		windowSpy.mockRestore()
	})
})
