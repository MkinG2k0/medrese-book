'use client'

import { useQuery } from '@tanstack/react-query'

import type {
	AuditEventFilters,
	AuditEventListResult,
} from '@/entities/audit-event/model/types'

export function useAuditEvents(filters: AuditEventFilters = {}) {
	return useQuery<AuditEventListResult>({
		queryKey: ['audit-events', filters],
		queryFn: async () => {
			const params = new URLSearchParams()
			if (filters.action) params.set('action', filters.action)
			if (filters.entityType) params.set('entityType', filters.entityType)
			if (filters.actorId) params.set('actorId', filters.actorId)
			if (filters.from) params.set('from', filters.from)
			if (filters.to) params.set('to', filters.to)
			if (filters.page) params.set('page', String(filters.page))
			if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

			const query = params.toString()
			const res = await fetch(
				query ? `/api/audit-events?${query}` : '/api/audit-events',
			)
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			return json.data
		},
	})
}
