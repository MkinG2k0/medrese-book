import webpush from 'web-push'

import { prisma } from '@/shared/lib/prisma'
import { ensureVapidConfigured } from '@/shared/lib/push/vapid'

export type PushPayload = {
	title: string
	body: string
	url?: string
	notificationId?: string
}

const PUSH_TTL_SECONDS = 60 * 60 * 24

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
	try {
		ensureVapidConfigured()
	} catch {
		return
	}

	const subscriptions = await prisma.pushSubscription.findMany({
		where: { userId },
	})

	if (subscriptions.length === 0) return

	const pushBody = JSON.stringify({
		title: payload.title,
		body: payload.body,
		url: payload.url ?? '/',
		notificationId: payload.notificationId,
	})

	await Promise.allSettled(
		subscriptions.map(async (sub) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { p256dh: sub.p256dh, auth: sub.auth },
					},
					pushBody,
					{ TTL: PUSH_TTL_SECONDS },
				)
			} catch (err) {
				const statusCode =
					err && typeof err === 'object' && 'statusCode' in err
						? (err as { statusCode?: number }).statusCode
						: undefined

				if (statusCode === 410) {
					await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
					return
				}

				if (process.env.NODE_ENV === 'development') {
					console.error('[Push Error]', err)
				}
			}
		}),
	)
}
