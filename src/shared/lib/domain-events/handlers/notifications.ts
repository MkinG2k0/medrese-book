import type { Prisma } from '@/shared/lib/prisma'

import type { DomainEvent } from '../types'

/**
 * No-op until Phase 6 notifications.
 *
 * Planned consumers for leave/substitution domain events:
 * - LEAVE_REQUEST_CREATED
 * - LEAVE_REQUEST_APPROVED
 * - LEAVE_REQUEST_REJECTED
 * - SUBSTITUTION_ACTIVATED
 */
export async function enqueueNotifications(
	_event: DomainEvent,
	_tx?: Prisma.TransactionClient,
) {
	// intentionally empty
}
