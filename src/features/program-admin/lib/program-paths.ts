export function programListPath(subjectId: string) {
	return `/admin/subjects/${subjectId}/program`
}

export function programLevelPath(subjectId: string, levelId: string) {
	return `/admin/subjects/${subjectId}/program/${levelId}`
}

export function programStepNewPath(subjectId: string, levelId: string) {
	return `/admin/subjects/${subjectId}/program/${levelId}/steps/new`
}

export function programStepEditPath(
	subjectId: string,
	levelId: string,
	stepId: string,
) {
	return `/admin/subjects/${subjectId}/program/${levelId}/steps/${stepId}/edit`
}
