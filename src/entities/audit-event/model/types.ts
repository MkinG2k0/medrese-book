import type { DomainEventAction } from '@/shared/lib/domain-events/types'

export type AuditEventFilters = {
	action?: DomainEventAction | string
	entityType?: string
	actorId?: string
	from?: string
	to?: string
	page?: number
	pageSize?: number
}

export type AuditEventListItem = {
	id: string
	actorId: string
	actorName: string
	action: string
	entityType: string
	entityId: string
	payload: Record<string, unknown>
	createdAt: string
}

export type AuditEventListResult = {
	items: AuditEventListItem[]
	total: number
	page: number
	pageSize: number
}

export type AuditFilterOptions = {
	actions: { value: string; label: string }[]
	entityTypes: { value: string; label: string }[]
	actors: { value: string; label: string }[]
}
