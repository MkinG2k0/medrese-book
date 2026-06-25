import type { Notification } from '@/shared/lib/prisma'

/**
 * Post-commit delivery hook for persisted notifications.
 * Push + SSE delivery will be implemented in plans 09-03 and 09-04.
 */
export async function deliverNotifications(_notifications: Notification[]) {
	// intentionally empty — push + SSE in 09-03/09-04
}
