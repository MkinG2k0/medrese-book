let pending: { stepId: number; scrollTop: number } | null = null

export function setPendingStepScroll(stepId: number, scrollTop: number) {
	pending = { stepId, scrollTop: Math.max(0, scrollTop) }
}

export function consumePendingStepScroll(stepId: number): number | null {
	if (!pending || pending.stepId !== stepId) return null
	const top = pending.scrollTop
	pending = null
	return top
}
