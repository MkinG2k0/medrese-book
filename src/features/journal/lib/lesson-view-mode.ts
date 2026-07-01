import type { TeachingSessionDto } from '@/features/journal/lib/teaching-session'
import { getLocalDateString } from '@/shared/lib/calendar-date'

export function shouldShowOnlyCompletedLessonSteps(
	dateFilter: string,
	teachingSession: Pick<TeachingSessionDto, 'endedAt'> | null | undefined,
): boolean {
	const isPast = dateFilter < getLocalDateString()
	if (isPast) return true
	return teachingSession?.endedAt != null
}
