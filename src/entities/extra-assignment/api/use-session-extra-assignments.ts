'use client'

import { useQuery } from '@tanstack/react-query'

import type { SessionExtraAssignmentInstance } from '@/entities/extra-assignment/model/types'

export type ExtraAssignmentJournalMode = 'active' | 'history'

export function useSessionExtraAssignments(
	studentId: string,
	date: string,
	options?: { mode?: ExtraAssignmentJournalMode },
) {
	const mode = options?.mode ?? 'active'

	return useQuery<SessionExtraAssignmentInstance[]>({
		queryKey: ['session-extra-assignments', studentId, date, mode],
		queryFn: async () => {
			const params = new URLSearchParams({ studentId, date, mode })
			const res = await fetch(`/api/extra-assignments/instances?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: !!studentId && !!date,
	})
}
