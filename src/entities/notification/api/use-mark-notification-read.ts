'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { MarkNotificationReadPayload } from '../model/types'

export function useMarkNotificationRead() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (payload: MarkNotificationReadPayload) => {
			const res = await fetch('/api/notifications/mark-read', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] })
			queryClient.invalidateQueries({
				queryKey: ['notifications', 'unread-count'],
			})
		},
	})
}
