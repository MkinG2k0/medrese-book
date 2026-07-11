import {
	getLocalDateString,
	isValidCalendarDate,
} from '@/shared/lib/calendar-date'

export const JOURNAL_DATE_PARAM = 'date'
export const JOURNAL_GROUP_PARAM = 'groupId'

export function resolveJournalDate(
	dateParam: string | null | undefined,
	today: string = getLocalDateString(),
): string {
	if (dateParam && isValidCalendarDate(dateParam)) {
		return dateParam
	}

	return today
}

export function resolveJournalGroupId(
	groupIdParam: string | null | undefined,
	allowedIds: string[],
	fallbackGroupId: string,
): string {
	if (groupIdParam && allowedIds.includes(groupIdParam)) {
		return groupIdParam
	}

	return fallbackGroupId
}

export function buildJournalHref(
	pathname: string,
	date: string,
	groupId?: string,
): string {
	const params = new URLSearchParams()
	params.set(JOURNAL_DATE_PARAM, date)
	if (groupId) {
		params.set(JOURNAL_GROUP_PARAM, groupId)
	}
	return `${pathname}?${params.toString()}`
}
