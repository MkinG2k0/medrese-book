import type { Prisma } from '@/shared/lib/prisma'
import { writeAuditEvent } from '@/shared/lib/audit/write-audit-event'

import { enqueueNotifications } from './handlers/notifications'
import type { DomainEvent } from './types'

export async function dispatchDomainEvent(
	event: DomainEvent,
	tx?: Prisma.TransactionClient,
) {
	await writeAuditEvent(event, tx)
	await enqueueNotifications(event, tx)
}
