import { error, success, serverError } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { markNotificationReadSchema } from '@/shared/lib/validations/notification'

export async function PATCH(request: Request) {
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

	const parsed = markNotificationReadSchema.safeParse(body)
	if (!parsed.success) {
		return error(parsed.error.issues[0]?.message ?? 'Некорректные данные')
	}

	const readAt = new Date()

	try {
		if ('all' in parsed.data) {
			const result = await prisma.notification.updateMany({
				where: { userId: session.user.id, readAt: null },
				data: { readAt },
			})
			return success({ updated: result.count })
		}

		const result = await prisma.notification.updateMany({
			where: {
				id: { in: parsed.data.ids },
				userId: session.user.id,
			},
			data: { readAt },
		})

		return success({ updated: result.count })
	} catch (err) {
		return serverError(err)
	}
}
