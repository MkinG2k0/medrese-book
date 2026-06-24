'use client'

import { useQuery } from '@tanstack/react-query'

import type {
	LeaveRequestFilters,
	LeaveRequestListItem,
} from '@/entities/leave-request/model/types'

export function useLeaveRequests(filters: LeaveRequestFilters = {}) {
	return useQuery<LeaveRequestListItem[]>({
		queryKey: ['leave-requests', filters],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (filters.status) params.set('status', filters.status)
			if (filters.type) params.set('type', filters.type)
			if (filters.teacherId) params.set('teacherId', filters.teacherId)
			if (filters.from) params.set('from', filters.from)
			if (filters.to) params.set('to', filters.to)

			const query = params.toString()
			const res = await fetch(
				query ? `/api/leave-requests?${query}` : '/api/leave-requests',
			)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
