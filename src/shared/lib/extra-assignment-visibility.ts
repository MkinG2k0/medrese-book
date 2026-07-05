import { isSameCalendarDay } from '@/shared/lib/calendar-date'

type ExtraAssignmentCompletionDates = {
	gradedAt: Date
	createdAt: Date
}

type ExtraAssignmentForVisibility = {
	session: { date: Date }
	completion: ExtraAssignmentCompletionDates | null
}

export function getExtraAssignmentGradedAt(
	completion: ExtraAssignmentCompletionDates,
): Date {
	return completion.gradedAt ?? completion.createdAt
}

/** Активный урок: незавершённые переносятся; завершённые — в день назначения или оценки. */
export function isExtraAssignmentVisibleOnActiveDay(
	instance: ExtraAssignmentForVisibility,
	dateStr: string,
): boolean {
	if (!instance.completion) return true

	return (
		isSameCalendarDay(instance.session.date, dateStr) ||
		isSameCalendarDay(getExtraAssignmentGradedAt(instance.completion), dateStr)
	)
}

/** Просмотр истории дня: только активность этого календарного дня. */
export function isExtraAssignmentVisibleOnHistoryDay(
	instance: ExtraAssignmentForVisibility,
	dateStr: string,
): boolean {
	if (!instance.completion) {
		return isSameCalendarDay(instance.session.date, dateStr)
	}

	return isExtraAssignmentVisibleOnActiveDay(instance, dateStr)
}
