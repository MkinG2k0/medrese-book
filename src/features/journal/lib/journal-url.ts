import {
	getLocalDateString,
	isValidCalendarDate,
} from '@/shared/lib/calendar-date'

export const JOURNAL_DATE_PARAM = 'date'

export function resolveJournalDate(
	dateParam: string | null | undefined,
	today: string = getLocalDateString(),
): string {
	if (dateParam && isValidCalendarDate(dateParam)) {
		return dateParam
	}

	return today
}

export function buildJournalHref(pathname: string, date: string): string {
	const params = new URLSearchParams()
	params.set(JOURNAL_DATE_PARAM, date)
	return `${pathname}?${params.toString()}`
}
