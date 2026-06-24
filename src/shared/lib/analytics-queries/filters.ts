export const countableSessionWhere = { isAdjustment: false } as const

export const countableCompletionWhere = { isPriorCredit: false } as const

export function analyticsCompletionFilter(dateRange: { gte: Date; lte: Date }) {
	return {
		createdAt: dateRange,
		isPriorCredit: false,
	}
}

export function analyticsSessionFilter(dateRange: { gte: Date; lte: Date }) {
	return {
		date: dateRange,
		isAdjustment: false,
	}
}
