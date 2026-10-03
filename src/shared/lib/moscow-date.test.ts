import { describe, expect, it } from 'vitest'

import {
	getMoscowCalendarDate,
	isLastCalendarDayInMoscow,
	lastCalendarDayOfMoscowMonth,
	moscowMonthKey,
	moscowMonthLabel,
} from './moscow-date'

describe('moscow-date', () => {
	it('reads calendar date in Europe/Moscow across UTC midnight', () => {
		const justAfterMoscowMidnight = new Date('2026-10-31T21:05:00.000Z')
		expect(getMoscowCalendarDate(justAfterMoscowMidnight)).toEqual({
			year: 2026,
			month: 11,
			day: 1,
		})
		expect(moscowMonthKey(justAfterMoscowMidnight)).toBe('2026-11')
	})

	it('detects last calendar day of October in Moscow', () => {
		const lastDayNoonMsk = new Date('2026-10-31T09:00:00.000Z')
		expect(isLastCalendarDayInMoscow(lastDayNoonMsk)).toBe(true)
		expect(lastCalendarDayOfMoscowMonth(lastDayNoonMsk)).toBe(31)
		expect(moscowMonthLabel(lastDayNoonMsk)).toBe('октябрь')
	})

	it('rejects the 30th of a 31-day Moscow month', () => {
		const day30NoonMsk = new Date('2026-10-30T09:00:00.000Z')
		expect(isLastCalendarDayInMoscow(day30NoonMsk)).toBe(false)
	})

	it('treats Feb 28 as last day in a non-leap year', () => {
		const feb28NoonMsk = new Date('2026-02-28T09:00:00.000Z')
		expect(isLastCalendarDayInMoscow(feb28NoonMsk)).toBe(true)
		expect(lastCalendarDayOfMoscowMonth(feb28NoonMsk)).toBe(28)
	})
})
