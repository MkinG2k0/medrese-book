import type { Prisma } from '@/shared/lib/prisma'
import { writeAuditEvent } from '@/shared/lib/audit/write-audit-event'

import type { DomainEvent } from '../types'

export async function recordAuditEvent(
	event: DomainEvent,
	tx?: Prisma.TransactionClient,
) {
	await writeAuditEvent(event, tx)
}
