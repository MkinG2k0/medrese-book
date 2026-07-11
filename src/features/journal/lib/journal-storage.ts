export const JOURNAL_GROUP_STORAGE_KEY = 'journal:lastGroupId'
export const JOURNAL_HISTORY_GROUP_STORAGE_KEY = 'journal:history:lastGroupId'

export function readJournalGroupId(key: string): string | null {
	if (typeof window === 'undefined') return null

	try {
		return localStorage.getItem(key)
	} catch {
		return null
	}
}

export function writeJournalGroupId(key: string, groupId: string): void {
	if (typeof window === 'undefined') return

	try {
		localStorage.setItem(key, groupId)
	} catch {
		/* ignore */
	}
}
