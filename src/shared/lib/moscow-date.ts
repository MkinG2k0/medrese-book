const MOSCOW_TIME_ZONE = 'Europe/Moscow'

const MOSCOW_MONTH_LABELS = [
	'январь',
	'февраль',
	'март',
	'апрель',
	'май',
	'июнь',
	'июль',
	'август',
	'сентябрь',
	'октябрь',
	'ноябрь',
	'декабрь',
] as const

export type MoscowCalendarDate = {
	year: number
	month: number
	day: number
}

function partValue(
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
): number {
	const value = parts.find((part) => part.type === type)?.value
	if (!value) throw new Error(`Не удалось прочитать ${type} для Москвы`)
	return Number(value)
}

export function getMoscowCalendarDate(now: Date = new Date()): MoscowCalendarDate {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: MOSCOW_TIME_ZONE,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	}).formatToParts(now)

	return {
		year: partValue(parts, 'year'),
		month: partValue(parts, 'month'),
		day: partValue(parts, 'day'),
	}
}

export function moscowMonthKey(now: Date = new Date()): string {
	const { year, month } = getMoscowCalendarDate(now)
	return `${year}-${String(month).padStart(2, '0')}`
}

export function moscowMonthLabel(now: Date = new Date()): string {
	const { month } = getMoscowCalendarDate(now)
	return MOSCOW_MONTH_LABELS[month - 1] ?? String(month)
}

export function lastCalendarDayOfMoscowMonth(now: Date = new Date()): number {
	const { year, month } = getMoscowCalendarDate(now)
	return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function isLastCalendarDayInMoscow(now: Date = new Date()): boolean {
	const { day } = getMoscowCalendarDate(now)
	return day === lastCalendarDayOfMoscowMonth(now)
}
