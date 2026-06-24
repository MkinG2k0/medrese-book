import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { serializeTeachingSession } from '@/features/journal/lib/teaching-session'
import { endTeachingSessionById } from '@/features/journal/lib/teaching-session-queries'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { endTeachingSessionSchema } from '@/shared/lib/validations/teaching-session'
import { error, notFound, success } from '@/shared/api'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
	const { id } = await params
	const body = await request.json()
	const parsed = endTeachingSessionSchema.safeParse(body)
	if (!parsed.success) return error(parsed.error.message)

	const teachingSession = await prisma.teachingSession.findUnique({
		where: { id },
		include: { group: true },
	})
	if (!teachingSession) return notFound('Урок не найден')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER'],
		context: { groupId: teachingSession.groupId },
	})
	if ('error' in authResult) return authResult.error

	if (teachingSession.endedAt != null) {
		return error('Урок уже завершён')
	}

	const endedAt = new Date()
	const saved = await prisma.$transaction(async (tx) => {
		const updated = await endTeachingSessionById(id, endedAt)

		await dispatchDomainEvent(
			{
				actorId: authResult.session.user.id,
				action: 'LESSON_ENDED',
				entityType: 'TeachingSession',
				entityId: updated.id,
				payload: {
					groupId: updated.groupId,
					startedAt: updated.startedAt.toISOString(),
					endedAt: endedAt.toISOString(),
					durationMinutes: Math.round(
						(endedAt.getTime() - updated.startedAt.getTime()) / 60_000,
					),
				},
			},
			tx,
		)

		return updated
	})

	return success(serializeTeachingSession(saved))
}
