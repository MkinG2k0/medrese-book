'use client'

import { useQuery } from '@tanstack/react-query'

import type { ConversationsPayload } from '../model/types'

export function useConversations() {
	return useQuery<ConversationsPayload>({
		queryKey: ['conversations'],
		queryFn: async () => {
			const res = await fetch('/api/conversations')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		refetchInterval: 5000,
	})
}
