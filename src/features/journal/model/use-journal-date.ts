'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import {
	buildJournalHref,
	JOURNAL_DATE_PARAM,
	JOURNAL_GROUP_PARAM,
	resolveJournalDate,
	resolveJournalGroupId,
} from '@/features/journal/lib/journal-url'
import {
	JOURNAL_GROUP_STORAGE_KEY,
	readJournalGroupId,
	writeJournalGroupId,
} from '@/features/journal/lib/journal-storage'
import { useJournalStore } from '@/features/journal/model/journal-store'
import { getLocalDateString } from '@/shared/lib/calendar-date'

type UseJournalDateOptions = {
	allowedGroupIds?: string[]
	defaultGroupId?: string
}

export function useJournalDate(options: UseJournalDateOptions = {}) {
	const { allowedGroupIds = [], defaultGroupId = '' } = options
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { dateFilter: storeDate, setDateFilter: setStoreDate } =
		useJournalStore()

	const dateFilter = resolveJournalDate(searchParams.get(JOURNAL_DATE_PARAM))

	const fallbackGroupId = useMemo(() => {
		const storedGroupId = readJournalGroupId(JOURNAL_GROUP_STORAGE_KEY)
		if (storedGroupId && allowedGroupIds.includes(storedGroupId)) {
			return storedGroupId
		}
		return defaultGroupId
	}, [allowedGroupIds, defaultGroupId])

	const groupId = resolveJournalGroupId(
		searchParams.get(JOURNAL_GROUP_PARAM),
		allowedGroupIds,
		fallbackGroupId,
	)

	useEffect(() => {
		if (!searchParams.get(JOURNAL_DATE_PARAM)) {
			const params = new URLSearchParams(searchParams.toString())
			params.set(JOURNAL_DATE_PARAM, getLocalDateString())
			router.replace(`${pathname}?${params.toString()}`)
		}
	}, [pathname, router, searchParams])

	useEffect(() => {
		if (
			!searchParams.get(JOURNAL_GROUP_PARAM) &&
			fallbackGroupId &&
			allowedGroupIds.includes(fallbackGroupId)
		) {
			const params = new URLSearchParams(searchParams.toString())
			params.set(JOURNAL_GROUP_PARAM, fallbackGroupId)
			router.replace(`${pathname}?${params.toString()}`)
		}
	}, [allowedGroupIds, fallbackGroupId, pathname, router, searchParams])

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

	const setGroupId = useCallback(
		(nextGroupId: string) => {
			writeJournalGroupId(JOURNAL_GROUP_STORAGE_KEY, nextGroupId)
			const params = new URLSearchParams(searchParams.toString())
			params.set(JOURNAL_GROUP_PARAM, nextGroupId)
			router.replace(`${pathname}?${params.toString()}`)
		},
		[pathname, router, searchParams],
	)

	const journalHref = useCallback(
		(targetPathname: string) =>
			buildJournalHref(
				targetPathname,
				dateFilter,
				groupId || undefined,
			),
		[dateFilter, groupId],
	)

	return { dateFilter, setDateFilter, groupId, setGroupId, journalHref }
}
