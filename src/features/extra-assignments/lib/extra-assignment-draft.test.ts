import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	clearExtraAssignmentDraft,
	draftStorageKey,
	readExtraAssignmentDraft,
	writeExtraAssignmentDraft,
} from '@/features/extra-assignments/lib/extra-assignment-draft'

function createLocalStorageMock() {
	const store = new Map<string, string>()
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value)
		},
		removeItem: (key: string) => {
			store.delete(key)
		},
		clear: () => store.clear(),
	}
}

const sampleDraft = {
	title: 'Повтор суры',
	levelId: 'lvl1',
	stepId: 'step1',
	content: { blocks: [{ type: 'text' as const, value: 'текст' }] },
}

describe('extra-assignment-draft', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createLocalStorageMock())
		vi.stubGlobal('window', {})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('builds storage key from user and subject', () => {
		expect(draftStorageKey('u1', 's1')).toBe('extra-assignment-draft:u1:s1')
	})

	it('reads and writes draft', () => {
		writeExtraAssignmentDraft('u1', 's1', sampleDraft)
		expect(readExtraAssignmentDraft('u1', 's1')).toEqual(sampleDraft)
	})

	it('returns null when key is missing', () => {
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('isolates drafts by subject', () => {
		writeExtraAssignmentDraft('u1', 's1', sampleDraft)
		expect(readExtraAssignmentDraft('u1', 's2')).toBeNull()
	})

	it('clears draft', () => {
		writeExtraAssignmentDraft('u1', 's1', sampleDraft)
		clearExtraAssignmentDraft('u1', 's1')
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('returns null on invalid JSON', () => {
		localStorage.setItem(draftStorageKey('u1', 's1'), '{not-json')
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('returns null on invalid shape', () => {
		localStorage.setItem(
			draftStorageKey('u1', 's1'),
			JSON.stringify({ title: 1, content: null }),
		)
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})

	it('returns null on SSR', () => {
		vi.unstubAllGlobals()
		expect(readExtraAssignmentDraft('u1', 's1')).toBeNull()
	})
})
