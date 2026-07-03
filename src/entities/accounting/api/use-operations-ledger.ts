'use client'

import { useQuery } from '@tanstack/react-query'

import type { LedgerEntry } from '@/entities/accounting/model/types'

export function useOperationsLedger(filters: {
	from?: string
	to?: string
	type?: string
}) {
	return useQuery<LedgerEntry[]>({
		queryKey: ['accounting-ledger', filters],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (filters.from) params.set('from', filters.from)
			if (filters.to) params.set('to', filters.to)
			if (filters.type) params.set('type', filters.type)
			const res = await fetch(`/api/accounting/ledger?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
