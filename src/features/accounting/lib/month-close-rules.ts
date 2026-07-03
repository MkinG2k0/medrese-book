export class MonthClosedError extends Error {
	constructor(month: string) {
		super(`Месяц ${month} закрыт для операций`)
		this.name = 'MonthClosedError'
	}
}

export function assertMonthOpenForKey(
	month: string,
	closedMonths: ReadonlySet<string>,
): void {
	if (closedMonths.has(month)) throw new MonthClosedError(month)
}
