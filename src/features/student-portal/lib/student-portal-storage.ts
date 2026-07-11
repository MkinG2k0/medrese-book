export const STUDENT_PORTAL_GROUP_STORAGE_KEY = 'student-portal:lastGroupId'

export function readStudentPortalGroupId(): string | null {
	if (typeof window === 'undefined') return null

	try {
		return localStorage.getItem(STUDENT_PORTAL_GROUP_STORAGE_KEY)
	} catch {
		return null
	}
}

export function writeStudentPortalGroupId(groupId: string): void {
	if (typeof window === 'undefined') return

	try {
		localStorage.setItem(STUDENT_PORTAL_GROUP_STORAGE_KEY, groupId)
	} catch {
		/* ignore */
	}
}
