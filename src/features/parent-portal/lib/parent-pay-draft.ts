const STORAGE_PREFIX = 'parent-pay-draft:'

export type ParentPayDraft = {
	selectedStudentIds: string[]
	amountsKopecks: Record<string, number>
}

export function loadParentPayDraft(parentUserId: string): ParentPayDraft | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${parentUserId}`)
		if (!raw) return null
		const parsed = JSON.parse(raw) as ParentPayDraft
		if (
			!parsed ||
			!Array.isArray(parsed.selectedStudentIds) ||
			typeof parsed.amountsKopecks !== 'object' ||
			parsed.amountsKopecks == null
		) {
			return null
		}
		return {
			selectedStudentIds: parsed.selectedStudentIds.filter(
				(id): id is string => typeof id === 'string',
			),
			amountsKopecks: Object.fromEntries(
				Object.entries(parsed.amountsKopecks).filter(
					([, value]) => typeof value === 'number' && Number.isFinite(value),
				),
			),
		}
	} catch {
		return null
	}
}

export function saveParentPayDraft(
	parentUserId: string,
	draft: ParentPayDraft,
): void {
	if (typeof window === 'undefined') return
	try {
		window.localStorage.setItem(
			`${STORAGE_PREFIX}${parentUserId}`,
			JSON.stringify(draft),
		)
	} catch {
		// ignore quota / private mode
	}
}

export function clearParentPayDraft(parentUserId: string): void {
	if (typeof window === 'undefined') return
	try {
		window.localStorage.removeItem(`${STORAGE_PREFIX}${parentUserId}`)
	} catch {
		// ignore
	}
}
