'use client'

import { useQuery } from '@tanstack/react-query'

import type { TeacherOwnSalary } from '@/entities/accounting/model/types'

export function useMySalary(month: string) {
	return useQuery<TeacherOwnSalary>({
		queryKey: ['accounting-my-salary', month],
		queryFn: async () => {
			const res = await fetch(`/api/accounting/my-salary?month=${month}`)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
