export function buildTeacherLessonsSearchParams(params: {
	from?: string
	to?: string
	teacher?: string
	groupId?: string
}): string {
	const search = new URLSearchParams()
	if (params.from) search.set('from', params.from)
	if (params.to) search.set('to', params.to)
	if (params.teacher) search.set('teacher', params.teacher)
	if (params.groupId) search.set('groupId', params.groupId)
	const qs = search.toString()
	return qs ? `?${qs}` : ''
}
