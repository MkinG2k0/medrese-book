export const STUDENT_STATUS_VALUES = ['ACTIVE', 'PAUSE', 'ARCHIVE'] as const

export type StudentStatus = (typeof STUDENT_STATUS_VALUES)[number]

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
	ACTIVE: 'Активен',
	PAUSE: 'Пауза',
	ARCHIVE: 'Архив',
}

export function isJournalVisibleStatus(status: StudentStatus): boolean {
	return status !== 'ARCHIVE'
}

export function isActiveForLesson(status: StudentStatus): boolean {
	return status === 'ACTIVE'
}
