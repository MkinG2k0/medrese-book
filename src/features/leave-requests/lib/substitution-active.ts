import { endOfDay, isAfter } from 'date-fns'

import type { SubstitutionDto } from '@/features/leave-requests/model/types'

type SubstitutionActiveInput = Pick<
	SubstitutionDto,
	'endDate' | 'isActive'
>

export function isSubstitutionCurrentlyActive(
	substitution: SubstitutionActiveInput,
	now: Date = new Date(),
): boolean {
	if (!substitution.isActive) {
		return false
	}

	const periodEnd = endOfDay(new Date(substitution.endDate))
	return !isAfter(now, periodEnd)
}
