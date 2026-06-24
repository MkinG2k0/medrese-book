import { APP_TIMEZONE } from '@/shared/lib/calendar-date'

export function formatLocalTime(
	date: Date,
	timeZone: string = APP_TIMEZONE,
): string {
	return new Intl.DateTimeFormat('ru-RU', {
		timeZone,
		hour: '2-digit',
		minute: '2-digit',
	}).format(date)
}

export function getLocalMinutesFromMidnight(
	date: Date,
	timeZone: string = APP_TIMEZONE,
): number {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(date)

	const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
	const minute = Number(
		parts.find((part) => part.type === 'minute')?.value ?? 0,
	)

	return hour * 60 + minute
}

export function formatMinutesFromMidnight(totalMinutes: number): string {
	const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
	const hours = Math.floor(normalized / 60)
	const minutes = Math.round(normalized % 60)
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function averageLocalTime(dates: Date[]): string | null {
	if (dates.length === 0) return null
	const avgMinutes =
		dates.reduce((sum, date) => sum + getLocalMinutesFromMidnight(date), 0) /
		dates.length
	return formatMinutesFromMidnight(avgMinutes)
}
