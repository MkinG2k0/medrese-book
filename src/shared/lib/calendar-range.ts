import { getCalendarDayQueryRange } from '@/shared/lib/calendar-date'

export function getCalendarRangeBounds(
	from: string,
	to: string,
): { start: Date; end: Date } {
	const fromRange = getCalendarDayQueryRange(from)
	const toRange = getCalendarDayQueryRange(to)
	return { start: fromRange.start, end: toRange.end }
}

export function listCalendarDays(from: string, to: string): string[] {
	const days: string[] = []
	let current = from

	while (current <= to) {
		days.push(current)
		const next = new Date(`${current}T12:00:00.000Z`)
		next.setUTCDate(next.getUTCDate() + 1)
		current = next.toISOString().slice(0, 10)
	}

	return days
}

export function isCalendarRange(from: string, to: string): boolean {
	return from !== to
}
