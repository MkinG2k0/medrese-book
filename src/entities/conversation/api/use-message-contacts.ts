'use client'

import { useQuery } from '@tanstack/react-query'

import type { MessageContact } from '../model/types'

export function useMessageContacts() {
	return useQuery<MessageContact[]>({
		queryKey: ['message-contacts'],
		queryFn: async () => {
			const res = await fetch('/api/messaging/contacts')
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
