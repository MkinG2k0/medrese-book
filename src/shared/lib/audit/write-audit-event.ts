import type { Prisma } from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'

import type { DomainEvent } from '../domain-events/types'

export async function writeAuditEvent(
	event: DomainEvent,
	tx?: Prisma.TransactionClient,
) {
	const client = tx ?? prisma

	await client.auditEvent.create({
		data: {
			actorId: event.actorId,
			action: event.action,
			entityType: event.entityType,
			entityId: event.entityId,
			payload: event.payload,
		},
	})
}
