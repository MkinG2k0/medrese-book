import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	JOURNAL_GROUP_STORAGE_KEY,
	JOURNAL_HISTORY_GROUP_STORAGE_KEY,
	readJournalGroupId,
	writeJournalGroupId,
} from '@/features/journal/lib/journal-storage'

function createLocalStorageMock() {
	const store = new Map<string, string>()
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value)
		},
		clear: () => store.clear(),
	}
}

describe('journal-storage', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createLocalStorageMock())
		vi.stubGlobal('window', {})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
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
		vi.unstubAllGlobals()
		expect(readJournalGroupId(JOURNAL_GROUP_STORAGE_KEY)).toBeNull()
	})
})
