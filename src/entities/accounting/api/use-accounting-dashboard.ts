'use client'

import { useQuery } from '@tanstack/react-query'

import type { SchoolBalanceSummary } from '@/entities/accounting/model/types'

export function useAccountingDashboard(month: string) {
	return useQuery<SchoolBalanceSummary>({
		queryKey: ['accounting-dashboard', month],
		queryFn: async () => {
			const res = await fetch(`/api/accounting/dashboard?month=${month}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
