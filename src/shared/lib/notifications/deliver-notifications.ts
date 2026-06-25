import type { Notification } from '@/shared/lib/prisma'
import { sendPushToUser } from '@/shared/lib/push/send-push'

/**
 * Post-commit delivery hook for persisted notifications.
 * Web Push is fire-and-forget; errors must not propagate to callers.
 */
export async function deliverNotifications(notifications: Notification[]): Promise<void> {
	if (notifications.length === 0) return

	await Promise.allSettled(
		notifications.map((notification) =>
			sendPushToUser(notification.userId, {
				title: notification.title,
				body: notification.body,
				url: notification.link ?? '/',
				notificationId: notification.id,
			}),
		),
	)
}
