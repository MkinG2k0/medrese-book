import { success, serverError } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'

function toNotificationDto(notification: {
	id: string
	type: string
	title: string
	body: string
	link: string | null
	readAt: Date | null
	createdAt: Date
}) {
	return {
		id: notification.id,
		type: notification.type,
		title: notification.title,
		body: notification.body,
		link: notification.link,
		readAt: notification.readAt?.toISOString() ?? null,
		createdAt: notification.createdAt.toISOString(),
	}
}

export async function GET(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	const { searchParams } = new URL(request.url)
	const limitParam = searchParams.get('limit')
	const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 50, 1), 100) : 50

	try {
		const notifications = await prisma.notification.findMany({
			where: { userId: session.user.id },
			orderBy: { createdAt: 'desc' },
			take: limit,
		})

		return success(notifications.map(toNotificationDto))
	} catch (err) {
		return serverError(err)
	}
}
