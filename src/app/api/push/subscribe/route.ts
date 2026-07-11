import { created, error, serverError, success, unauthorized } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import {
	pushSubscriptionSchema,
	pushUnsubscribeSchema,
} from '@/shared/lib/validations/push-subscription'

export async function POST(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return error('Некорректное тело запроса')
	}

	const parsed = pushSubscriptionSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	const { endpoint, keys } = parsed.data

	const sessionUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { id: true },
	})
	if (!sessionUser) {
		return unauthorized()
	}

	try {
		const subscription = await prisma.pushSubscription.upsert({
			where: { endpoint },
			create: {
				userId: session.user.id,
				endpoint,
				p256dh: keys.p256dh,
				auth: keys.auth,
			},
			update: {
				userId: session.user.id,
				p256dh: keys.p256dh,
				auth: keys.auth,
			},
		})

		return created({ id: subscription.id, endpoint: subscription.endpoint })
	} catch (err) {
		return serverError(err)
	}
}

export async function DELETE(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	let body: unknown = {}
	try {
		const text = await request.text()
		if (text) body = JSON.parse(text)
	} catch {
		return error('Некорректное тело запроса')
	}

	const parsed = pushUnsubscribeSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	try {
		if (parsed.data.endpoint) {
			await prisma.pushSubscription.deleteMany({
				where: {
					endpoint: parsed.data.endpoint,
					userId: session.user.id,
				},
			})
		} else {
			await prisma.pushSubscription.deleteMany({
				where: { userId: session.user.id },
			})
		}

		return success({ ok: true })
	} catch (err) {
		return serverError(err)
	}
}
