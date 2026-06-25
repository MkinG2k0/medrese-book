'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ChatMessage } from '../model/types'

export function useMessages(conversationId: string | null) {
	return useQuery<ChatMessage[]>({
		queryKey: ['messages', conversationId],
		queryFn: async () => {
			const res = await fetch(`/api/conversations/${conversationId}/messages`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
		enabled: !!conversationId,
		refetchInterval: 5000,
	})
}

export function useSendMessage(conversationId: string | null) {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (body: string) => {
			const res = await fetch(`/api/conversations/${conversationId}/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body }),
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data as ChatMessage
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
			void queryClient.invalidateQueries({ queryKey: ['conversations'] })
		},
	})
}
