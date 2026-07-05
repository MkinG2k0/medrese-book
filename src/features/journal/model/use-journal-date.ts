'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'

import {
	buildJournalHref,
	JOURNAL_DATE_PARAM,
	resolveJournalDate,
} from '@/features/journal/lib/journal-url'
import { useJournalStore } from '@/features/journal/model/journal-store'
import { getLocalDateString } from '@/shared/lib/calendar-date'

export function useJournalDate() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { dateFilter: storeDate, setDateFilter: setStoreDate } =
		useJournalStore()

	const dateFilter = resolveJournalDate(searchParams.get(JOURNAL_DATE_PARAM))

	useEffect(() => {
		if (!searchParams.get(JOURNAL_DATE_PARAM)) {
			const params = new URLSearchParams(searchParams.toString())
			params.set(JOURNAL_DATE_PARAM, getLocalDateString())
			router.replace(`${pathname}?${params.toString()}`)
		}
	}, [pathname, router, searchParams])

	useEffect(() => {
		if (storeDate !== dateFilter) {
			setStoreDate(dateFilter)
		}
	}, [dateFilter, setStoreDate, storeDate])

	const setDateFilter = useCallback(
		(date: string) => {
			setStoreDate(date)
			const params = new URLSearchParams(searchParams.toString())
			params.set(JOURNAL_DATE_PARAM, date)
			router.replace(`${pathname}?${params.toString()}`)
		},
		[pathname, router, searchParams, setStoreDate],
	)

	const journalHref = useCallback(
		(targetPathname: string) => buildJournalHref(targetPathname, dateFilter),
		[dateFilter],
	)

	return { dateFilter, setDateFilter, journalHref }
}
