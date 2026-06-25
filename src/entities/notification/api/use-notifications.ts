'use client'

import { useQuery } from '@tanstack/react-query'

import type { NotificationItem } from '../model/types'

export function useNotifications() {
	return useQuery<NotificationItem[]>({
		queryKey: ['notifications'],
		queryFn: async () => {
			const res = await fetch('/api/notifications')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
