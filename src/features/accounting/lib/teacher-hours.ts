import { getTeachingSessionDurationMs } from '@/features/journal/lib/teaching-session'

export const LESSON_ANOMALY_MINUTES = 180

export type TeachingSessionWithAdjustment = {
	id: string
	teacherId: string
	startedAt: Date
	endedAt: Date | null
	date: Date
	durationAdjustment?: {
		originalMinutes: number
		adjustedMinutes: number
	} | null
}

export function getSessionDurationMinutes(
	session: TeachingSessionWithAdjustment,
): number | null {
	if (session.durationAdjustment) {
		return session.durationAdjustment.adjustedMinutes
	}
	const ms = getTeachingSessionDurationMs(session)
	if (ms == null || ms <= 0) return null
	return Math.ceil(ms / 60_000)
}

export function isSessionAnomaly(
	session: TeachingSessionWithAdjustment,
): boolean {
	if (session.durationAdjustment) return false
	const minutes = getSessionDurationMinutes(session)
	return minutes != null && minutes > LESSON_ANOMALY_MINUTES
}

export function sumTeacherMinutes(
	sessions: TeachingSessionWithAdjustment[],
): number {
	return sessions.reduce((sum, session) => {
		const minutes = getSessionDurationMinutes(session)
		return sum + (minutes ?? 0)
	}, 0)
}

export function countUnresolvedAnomalies(
	sessions: TeachingSessionWithAdjustment[],
): number {
	return sessions.filter(isSessionAnomaly).length
}

export async function resolveHourlyRateKopecks(
	teacherId: string,
	at: Date,
	rates: { hourlyRate: number; validFrom: Date }[],
): Promise<number> {
	const applicable = rates
		.filter((rate) => rate.validFrom <= at)
		.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())
	return applicable[0]?.hourlyRate ?? 0
}

export function calcWeightedSalaryKopecks(
	sessions: TeachingSessionWithAdjustment[],
	rates: { hourlyRate: number; validFrom: Date }[],
): { totalMinutes: number; amount: number; anomalyCount: number } {
	let amount = 0
	let totalMinutes = 0

	for (const session of sessions) {
		const minutes = getSessionDurationMinutes(session)
		if (minutes == null || minutes <= 0) continue
		totalMinutes += minutes
		const hourlyRate = rates
			.filter((rate) => rate.validFrom <= session.date)
			.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0]
			?.hourlyRate ?? 0
		amount += Math.round((minutes * hourlyRate) / 60)
	}

	return {
		totalMinutes,
		amount,
		anomalyCount: countUnresolvedAnomalies(sessions),
	}
}
