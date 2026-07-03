export function toMonthKey(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	return `${year}-${month}`
}

export function parseMonthKey(month: string): { year: number; month: number } {
	const match = /^(\d{4})-(\d{2})$/.exec(month)
	if (!match) throw new Error('Некорректный месяц')
	return { year: Number(match[1]), month: Number(match[2]) }
}

export function monthKeyToDateRange(month: string): { start: Date; end: Date } {
	const { year, month: m } = parseMonthKey(month)
	const start = new Date(year, m - 1, 1, 0, 0, 0, 0)
	const end = new Date(year, m, 0, 23, 59, 59, 999)
	return { start, end }
}

export function isDateInMonth(date: Date, month: string): boolean {
	return toMonthKey(date) === month
}

export function currentMonthKey(): string {
	return toMonthKey(new Date())
}

export function getAccountingMonth(searchParams: URLSearchParams): string {
	const month = searchParams.get('month')
	if (month && /^\d{4}-\d{2}$/.test(month)) return month
	return currentMonthKey()
}

export function previousMonthKey(month: string): string {
	const { year, month: m } = parseMonthKey(month)
	const date = new Date(year, m - 2, 1)
	return toMonthKey(date)
}
