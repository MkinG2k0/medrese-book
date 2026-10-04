export type TeacherRateHistoryItem = {
	id: string
	hourlyRateKopecks: number
	validFrom: string
	isCurrent: boolean
}

export function pickCurrentTeacherRate<T extends { validFrom: string }>(
	history: T[],
	today: string,
): T | null {
	return (
		history
			.filter((rate) => rate.validFrom <= today)
			.sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] ?? null
	)
}

export function withCurrentRateFlag<T extends { validFrom: string }>(
	history: T[],
	today: string,
): Array<T & { isCurrent: boolean }> {
	const current = pickCurrentTeacherRate(history, today)
	return history
		.slice()
		.sort((a, b) => b.validFrom.localeCompare(a.validFrom))
		.map((rate) => ({
			...rate,
			isCurrent: current != null && rate.validFrom === current.validFrom,
		}))
}
