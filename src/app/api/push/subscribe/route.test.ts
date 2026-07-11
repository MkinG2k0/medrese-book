import { beforeEach, describe, expect, it, vi } from 'vitest'

const authorizeApiRequestMock = vi.fn()
const userFindUniqueMock = vi.fn()
const pushSubscriptionUpsertMock = vi.fn()

vi.mock('@/shared/lib/authorize-api-request', () => ({
	authorizeApiRequest: (...args: unknown[]) => authorizeApiRequestMock(...args),
}))

vi.mock('@/shared/lib/prisma', () => ({
	prisma: {
		user: {
			findUnique: (...args: unknown[]) => userFindUniqueMock(...args),
		},
		pushSubscription: {
			upsert: (...args: unknown[]) => pushSubscriptionUpsertMock(...args),
			deleteMany: vi.fn(),
		},
	},
}))

const validBody = {
	endpoint: 'https://push.example.com/subscription/abc',
	keys: {
		p256dh: 'p256dh-key',
		auth: 'auth-key',
	},
}

describe('POST /api/push/subscribe', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		authorizeApiRequestMock.mockResolvedValue({
			session: {
				user: {
					id: 'user-1',
					role: 'MANAGER',
				},
			},
		})
	})

	it('returns 401 when session user is missing in database', async () => {
		userFindUniqueMock.mockResolvedValue(null)

		const { POST } = await import('./route')
		const response = await POST(
			new Request('http://localhost/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(validBody),
			}),
		)

		expect(response.status).toBe(401)
		const json = (await response.json()) as { data: null; error: string }
		expect(json.error).toBe('Требуется авторизация')
		expect(pushSubscriptionUpsertMock).not.toHaveBeenCalled()
	})

	it('creates subscription when session user exists', async () => {
		userFindUniqueMock.mockResolvedValue({ id: 'user-1' })
		pushSubscriptionUpsertMock.mockResolvedValue({
			id: 'sub-1',
			endpoint: validBody.endpoint,
		})

		const { POST } = await import('./route')
		const response = await POST(
			new Request('http://localhost/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(validBody),
			}),
		)

		expect(response.status).toBe(201)
		expect(pushSubscriptionUpsertMock).toHaveBeenCalledWith({
			where: { endpoint: validBody.endpoint },
			create: {
				userId: 'user-1',
				endpoint: validBody.endpoint,
				p256dh: validBody.keys.p256dh,
				auth: validBody.keys.auth,
			},
			update: {
				userId: 'user-1',
				p256dh: validBody.keys.p256dh,
				auth: validBody.keys.auth,
			},
		})
	})
})
