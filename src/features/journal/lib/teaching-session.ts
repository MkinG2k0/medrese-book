import type { TeachingSession } from '@/shared/lib/prisma'

export type TeachingSessionDto = {
	id: string
	groupId: string
	date: string
	startedAt: string
	endedAt: string | null
	durationMinutes: number | null
	isActive: boolean
}

export function serializeTeachingSession(
	session: TeachingSession,
): TeachingSessionDto {
	const endedAt = session.endedAt?.toISOString() ?? null
	const durationMinutes =
		session.endedAt != null
			? Math.round(
					(session.endedAt.getTime() - session.startedAt.getTime()) / 60_000,
				)
			: null

	return {
		id: session.id,
		groupId: session.groupId,
		date: session.date.toISOString(),
		startedAt: session.startedAt.toISOString(),
		endedAt,
		durationMinutes,
		isActive: session.endedAt == null,
	}
}
