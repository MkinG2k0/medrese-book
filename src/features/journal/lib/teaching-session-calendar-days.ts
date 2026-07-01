import { getLocalDateString } from '@/shared/lib/calendar-date'

export function collectTeachingSessionCalendarDays(
	sessions: { date: Date; startedAt: Date }[],
	from: string,
	to: string,
): string[] {
	const dates = new Set<string>()

	for (const session of sessions) {
		for (const dayKey of [
			getLocalDateString(session.date),
			getLocalDateString(session.startedAt),
		]) {
			if (dayKey >= from && dayKey <= to) {
				dates.add(dayKey)
			}
		}
	}

	return [...dates].sort()
}
