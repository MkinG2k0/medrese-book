import type {
	AuditEventListItem,
	AuditEventListResult,
} from '@/entities/audit-event/model/types'
import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'
import type { AuditEventQueryInput } from '@/shared/lib/validations/audit-event'

function buildWhereClause(
	filters: AuditEventQueryInput,
): Prisma.AuditEventWhereInput {
	const where: Prisma.AuditEventWhereInput = {}

	if (filters.action) {
		where.action = filters.action
	}

	if (filters.entityType) {
		where.entityType = filters.entityType
	}

	if (filters.actorId) {
		where.actorId = filters.actorId
	}

	if (filters.from || filters.to) {
		where.createdAt = {
			...(filters.from ? { gte: new Date(filters.from) } : {}),
			...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}),
		}
	}

	return where
}

export async function queryAuditEvents(
	filters: AuditEventQueryInput,
): Promise<AuditEventListResult> {
	const where = buildWhereClause(filters)
	const skip = (filters.page - 1) * filters.pageSize

	const [events, total] = await Promise.all([
		prisma.auditEvent.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip,
			take: filters.pageSize,
		}),
		prisma.auditEvent.count({ where }),
	])

	const actorIds = [...new Set(events.map((event) => event.actorId))]
	const actors =
		actorIds.length > 0
			? await prisma.user.findMany({
					where: { id: { in: actorIds } },
					select: { id: true, name: true },
				})
			: []

	const actorNameById = new Map(actors.map((user) => [user.id, user.name]))

	const items: AuditEventListItem[] = events.map((event) => ({
		id: event.id,
		actorId: event.actorId,
		actorName: actorNameById.get(event.actorId) ?? 'Неизвестный',
		action: event.action,
		entityType: event.entityType,
		entityId: event.entityId,
		payload:
			event.payload && typeof event.payload === 'object'
				? (event.payload as Record<string, unknown>)
				: {},
		createdAt: event.createdAt.toISOString(),
	}))

	return {
		items,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
	}
}

export async function queryAuditActorOptions(): Promise<
	{ value: string; label: string }[]
> {
	const rows = await prisma.auditEvent.findMany({
		select: { actorId: true },
		distinct: ['actorId'],
		orderBy: { actorId: 'asc' },
	})

	if (rows.length === 0) return []

	const users = await prisma.user.findMany({
		where: { id: { in: rows.map((row) => row.actorId) } },
		select: { id: true, name: true },
		orderBy: { name: 'asc' },
	})

	return users.map((user) => ({ value: user.id, label: user.name }))
}
