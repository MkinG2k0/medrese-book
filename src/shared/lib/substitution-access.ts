import { endOfDay, isAfter } from 'date-fns'

import { prisma, type Substitution } from '@/shared/lib/prisma'

type SubstitutionActiveInput = Pick<Substitution, 'endDate' | 'isActive'>

function isSubstitutionCurrentlyActive(
	substitution: SubstitutionActiveInput,
	now: Date = new Date(),
): boolean {
	if (!substitution.isActive) {
		return false
	}

	const periodEnd = endOfDay(new Date(substitution.endDate))
	return !isAfter(now, periodEnd)
}

export async function getActiveSubstitutionsForSubstitute(
	substituteTeacherId: string,
) {
	const substitutions = await prisma.substitution.findMany({
		where: {
			substituteTeacherId,
			isActive: true,
		},
		include: {
			absentTeacher: { include: { user: true } },
		},
	})

	return substitutions.filter((s) => isSubstitutionCurrentlyActive(s))
}

export async function canSubstituteAccessGroup(
	substituteTeacherId: string,
	groupTeacherId: string,
): Promise<boolean> {
	const active = await getActiveSubstitutionsForSubstitute(substituteTeacherId)
	return active.some((s) => s.absentTeacherId === groupTeacherId)
}

export async function getSubstitutableTeacherUserIds(
	substituteTeacherId: string,
): Promise<string[]> {
	const active = await getActiveSubstitutionsForSubstitute(substituteTeacherId)
	return active.map((s) => s.absentTeacher.userId)
}
