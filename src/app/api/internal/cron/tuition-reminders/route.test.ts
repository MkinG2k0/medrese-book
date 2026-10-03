import { beforeEach, describe, expect, it, vi } from 'vitest'

const verifyCronSecretMock = vi.fn()
const sendTuitionRemindersMock = vi.fn()
const deliverNotificationsMock = vi.fn()
const transactionMock = vi.fn()

vi.mock('@/shared/lib/verify-cron-secret', () => ({
	verifyCronSecret: (...args: unknown[]) => verifyCronSecretMock(...args),
}))

vi.mock('@/features/parent-portal/lib/send-tuition-reminders', () => ({
	sendTuitionReminders: (...args: unknown[]) => sendTuitionRemindersMock(...args),
}))

vi.mock('@/shared/lib/notifications/deliver-notifications', () => ({
	deliverNotifications: (...args: unknown[]) => deliverNotificationsMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		$transaction: (...args: unknown[]) => transactionMock(...args),
	},
}))

describe('GET /api/internal/cron/tuition-reminders', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		verifyCronSecretMock.mockReturnValue(null)
		sendTuitionRemindersMock.mockResolvedValue({
			month: '2026-10',
			lastDay: true,
			eligibleParentIds: ['parent-1'],
			created: 1,
			skippedExisting: 0,
			notifications: [{ id: 'n1', userId: 'parent-1' }],
		})
		transactionMock.mockImplementation(async (fn: (tx: unknown) => unknown) =>
			fn({}),
		)
	})

	it('returns 401 when cron secret is invalid', async () => {
		verifyCronSecretMock.mockReturnValue(
			new Response(JSON.stringify({ data: null, error: 'Unauthorized' }), {
				status: 401,
			}),
		)

		const { GET } = await import('./route')
		const response = await GET(
			new Request('http://localhost/api/internal/cron/tuition-reminders'),
		)

		expect(response.status).toBe(401)
		expect(sendTuitionRemindersMock).not.toHaveBeenCalled()
	})

	it('creates reminders and delivers push', async () => {
		const { GET } = await import('./route')
		const response = await GET(
			new Request('http://localhost/api/internal/cron/tuition-reminders'),
		)
		const json = await response.json()

		expect(response.status).toBe(200)
		expect(json.data).toMatchObject({
			month: '2026-10',
			lastDay: true,
			eligible: 1,
			created: 1,
		})
		expect(deliverNotificationsMock).toHaveBeenCalledWith([
			{ id: 'n1', userId: 'parent-1' },
		])
	})
})
