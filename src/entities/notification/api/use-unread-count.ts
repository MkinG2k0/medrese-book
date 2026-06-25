'use client'

import { useQuery } from '@tanstack/react-query'

import type { UnreadCountResponse } from '../model/types'

export function useUnreadCount() {
	return useQuery<UnreadCountResponse>({
		queryKey: ['notifications', 'unread-count'],
		queryFn: async () => {
			const res = await fetch('/api/notifications/unread-count')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		refetchInterval: 60_000,
	})
}
