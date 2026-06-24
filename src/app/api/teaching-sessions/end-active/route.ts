import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { serializeTeachingSession } from '@/features/journal/lib/teaching-session'
import { findActiveTeachingSession } from '@/features/journal/lib/teaching-session-queries'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { success } from '@/shared/api'

export async function POST() {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER'],
	})
	if ('error' in authResult) return authResult.error

	const teacherId = authResult.session.user.teacherId!
	const active = await findActiveTeachingSession(teacherId)
	if (!active) return success(null)

	const endedAt = new Date()
	const saved = await prisma.$transaction(async (tx) => {
		const updated = await tx.teachingSession.update({
			where: { id: active.id },
			data: { endedAt },
		})

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
					durationMinutes: Math.ceil(
						(endedAt.getTime() - updated.startedAt.getTime()) / 60_000,
					),
					reason: 'logout',
				},
			},
			tx,
		)

		return updated
	})

	return success(serializeTeachingSession(saved))
}
