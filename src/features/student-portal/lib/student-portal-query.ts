export const STUDENT_PORTAL_GROUP_PARAM = 'groupId'

export function resolveStudentGroupId(
	groupIdParam: string | null | undefined,
	allowedIds: string[],
	fallbackGroupId: string,
): string {
	if (groupIdParam && allowedIds.includes(groupIdParam)) {
		return groupIdParam
	}

	return fallbackGroupId
}

export function buildStudentPortalHref(
	pathname: string,
	groupId?: string,
): string {
	if (!groupId) {
		return pathname
	}

	const params = new URLSearchParams()
	params.set(STUDENT_PORTAL_GROUP_PARAM, groupId)
	return `${pathname}?${params.toString()}`
}
