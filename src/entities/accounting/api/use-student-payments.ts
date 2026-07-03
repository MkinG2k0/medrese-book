'use client'

import { useQuery } from '@tanstack/react-query'

import type { StudentPaymentRow } from '@/entities/accounting/model/types'

export function useStudentPayments(month: string, debtorsOnly: boolean) {
	return useQuery<StudentPaymentRow[]>({
		queryKey: ['accounting-payments', month, debtorsOnly],
		queryFn: async () => {
			const params = new URLSearchParams({ month })
			if (debtorsOnly) params.set('debtorsOnly', '1')
			const res = await fetch(`/api/accounting/payments?${params}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
