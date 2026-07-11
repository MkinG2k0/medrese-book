'use client'

import { useCallback, useMemo, useState } from 'react'

import { resolveJournalGroupId } from '@/features/journal/lib/journal-url'
import {
	JOURNAL_HISTORY_GROUP_STORAGE_KEY,
	readJournalGroupId,
	writeJournalGroupId,
} from '@/features/journal/lib/journal-storage'

type UseJournalHistoryGroupOptions = {
	allowedGroupIds: string[]
	defaultGroupId: string
}

export function useJournalHistoryGroup({
	allowedGroupIds,
	defaultGroupId,
}: UseJournalHistoryGroupOptions) {
	const fallbackGroupId = useMemo(() => {
		const storedGroupId = readJournalGroupId(JOURNAL_HISTORY_GROUP_STORAGE_KEY)
		if (storedGroupId && allowedGroupIds.includes(storedGroupId)) {
			return storedGroupId
		}
		return defaultGroupId
	}, [allowedGroupIds, defaultGroupId])

	const [selectedGroupId, setSelectedGroupId] = useState(fallbackGroupId)

	const groupId = resolveJournalGroupId(
		selectedGroupId,
		allowedGroupIds,
		fallbackGroupId,
	)

	const setGroupId = useCallback((nextGroupId: string) => {
		writeJournalGroupId(JOURNAL_HISTORY_GROUP_STORAGE_KEY, nextGroupId)
		setSelectedGroupId(nextGroupId)
	}, [])

	return { groupId, setGroupId }
}
