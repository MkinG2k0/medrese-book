export const ANALYTICS_SUBJECT_STORAGE_KEY = 'analytics:lastSubjectId'

export function readAnalyticsSubjectId(): string | null {
	if (typeof window === 'undefined') return null

	try {
		return localStorage.getItem(ANALYTICS_SUBJECT_STORAGE_KEY)
	} catch {
		return null
	}
}

export function writeAnalyticsSubjectId(subjectId: string): void {
	if (typeof window === 'undefined') return

	try {
		localStorage.setItem(ANALYTICS_SUBJECT_STORAGE_KEY, subjectId)
	} catch {
		/* ignore */
	}
}
