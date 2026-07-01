import { getLocalDateString } from '@/shared/lib/calendar-date'
import { prisma } from '@/shared/lib/prisma'

function getTeachingSessionDurationMinutes(session: {
	startedAt: Date
	endedAt: Date | null
}): number | null {
	if (session.endedAt == null) return null
	const durationMs = Math.max(
		0,
		session.endedAt.getTime() - session.startedAt.getTime(),
	)
	return Math.ceil(durationMs / 60_000)
}

export async function buildTeachingSessionDurationByDate(
	groupId: string,
	dateRange: { gte: Date; lte: Date },
): Promise<Map<string, number | null>> {
	const sessions = await prisma.teachingSession.findMany({
		where: {
			groupId,
			OR: [
				{ date: { gte: dateRange.gte, lte: dateRange.lte } },
				{ startedAt: { gte: dateRange.gte, lte: dateRange.lte } },
			],
		},
	})

	const map = new Map<string, number | null>()

	for (const session of sessions) {
		const dayKey = getLocalDateString(session.date)
		const durationMinutes = getTeachingSessionDurationMinutes(session)

		if (durationMinutes == null) {
			if (!map.has(dayKey)) map.set(dayKey, null)
			continue
		}

		map.set(dayKey, (map.get(dayKey) ?? 0) + durationMinutes)
	}

	return map
}

export function teachingSessionDurationFromMap(
	durationByDate: Map<string, number | null>,
	sessionDate: Date,
): number | null {
	return durationByDate.get(getLocalDateString(sessionDate)) ?? null
}
