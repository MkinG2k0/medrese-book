import type { TeachingSession } from '@/shared/lib/prisma'

import { formatElapsedMs } from '@/features/journal/lib/format-elapsed'

export type TeachingSessionDto = {
	id: string
	groupId: string
	date: string
	startedAt: string
	endedAt: string | null
	durationMs: number | null
	durationMinutes: number | null
	isActive: boolean
}

export function getTeachingSessionDurationMs(session: {
	startedAt: Date
	endedAt: Date | null
}): number | null {
	if (session.endedAt == null) return null
	return Math.max(0, session.endedAt.getTime() - session.startedAt.getTime())
}

export function formatTeachingSessionDurationLabel(
	session: Pick<
		TeachingSessionDto,
		'startedAt' | 'endedAt' | 'durationMs' | 'isActive'
	> | null | undefined,
): string {
	if (!session || session.isActive || !session.endedAt) {
		return 'время не учтено'
	}

	const durationMs =
		session.durationMs ??
		getTeachingSessionDurationMs({
			startedAt: new Date(session.startedAt),
			endedAt: new Date(session.endedAt),
		})

	if (durationMs == null || durationMs <= 0) {
		return 'время не учтено'
	}

	return formatElapsedMs(durationMs)
}

export function serializeTeachingSession(
	session: TeachingSession,
): TeachingSessionDto {
	const endedAt = session.endedAt?.toISOString() ?? null
	const durationMs = getTeachingSessionDurationMs(session)
	const durationMinutes =
		durationMs != null ? Math.ceil(durationMs / 60_000) : null

	return {
		id: session.id,
		groupId: session.groupId,
		date: session.date.toISOString(),
		startedAt: session.startedAt.toISOString(),
		endedAt,
		durationMs,
		durationMinutes,
		isActive: session.endedAt == null,
	}
}
