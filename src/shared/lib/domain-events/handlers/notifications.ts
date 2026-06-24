import type { Prisma } from '@/shared/lib/prisma'

import type { DomainEvent } from '../types'

/** No-op until Phase 6 notifications. */
export async function enqueueNotifications(
	_event: DomainEvent,
	_tx?: Prisma.TransactionClient,
) {
	// intentionally empty
}
