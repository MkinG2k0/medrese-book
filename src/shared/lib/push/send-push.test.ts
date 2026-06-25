import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendNotification, setVapidDetails, findMany, deleteSubscription, ensureVapidConfigured } =
	vi.hoisted(() => ({
		sendNotification: vi.fn(),
		setVapidDetails: vi.fn(),
		findMany: vi.fn(),
		deleteSubscription: vi.fn(),
		ensureVapidConfigured: vi.fn(),
	}))

vi.mock('web-push', () => ({
	default: {
		sendNotification,
		setVapidDetails,
	},
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		pushSubscription: {
			findMany,
			delete: deleteSubscription,
		},
	},
}))

vi.mock('@/shared/lib/push/vapid', () => ({
	ensureVapidConfigured,
}))

import { sendPushToUser } from './send-push'

const sampleSubscription = {
	id: 'sub-1',
	userId: 'user-1',
	endpoint: 'https://push.example/endpoint',
	p256dh: 'p256dh-key',
	auth: 'auth-key',
	createdAt: new Date(),
	updatedAt: new Date(),
}

describe('sendPushToUser', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		ensureVapidConfigured.mockImplementation(() => undefined)
		findMany.mockResolvedValue([sampleSubscription])
		sendNotification.mockResolvedValue(undefined)
		deleteSubscription.mockResolvedValue(sampleSubscription)
	})

	it('calls webpush.sendNotification for each subscription with payload JSON', async () => {
		await sendPushToUser('user-1', {
			title: 'Заявка подтверждена',
			body: 'Отпуск',
			url: '/calendar',
			notificationId: 'notif-1',
		})

		expect(ensureVapidConfigured).toHaveBeenCalledOnce()
		expect(findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
		expect(sendNotification).toHaveBeenCalledOnce()
		expect(sendNotification).toHaveBeenCalledWith(
			{
				endpoint: sampleSubscription.endpoint,
				keys: { p256dh: sampleSubscription.p256dh, auth: sampleSubscription.auth },
			},
			JSON.stringify({
				title: 'Заявка подтверждена',
				body: 'Отпуск',
				url: '/calendar',
				notificationId: 'notif-1',
			}),
			{ TTL: 86400 },
		)
	})

	it('deletes stale subscription when push service returns HTTP 410', async () => {
		sendNotification.mockRejectedValue({ statusCode: 410 })

		await sendPushToUser('user-1', {
			title: 'Тест',
			body: 'Тело',
		})

		expect(deleteSubscription).toHaveBeenCalledWith({
			where: { endpoint: sampleSubscription.endpoint },
		})
	})

	it('skips send when VAPID is not configured', async () => {
		ensureVapidConfigured.mockImplementation(() => {
			throw new Error(
				'VAPID не настроен: задайте VAPID_SUBJECT, VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в env',
			)
		})

		await sendPushToUser('user-1', { title: 'Тест', body: 'Тело' })

		expect(findMany).not.toHaveBeenCalled()
		expect(sendNotification).not.toHaveBeenCalled()
	})

	it('returns early when user has no push subscriptions', async () => {
		findMany.mockResolvedValue([])

		await sendPushToUser('user-1', { title: 'Тест', body: 'Тело' })

		expect(sendNotification).not.toHaveBeenCalled()
	})
})
