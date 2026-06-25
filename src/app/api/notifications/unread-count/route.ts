import { success, serverError } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'

export async function GET() {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult

	try {
		const count = await prisma.notification.count({
			where: { userId: session.user.id, readAt: null },
		})

		return success({ count })
	} catch (err) {
		return serverError(err)
	}
}
