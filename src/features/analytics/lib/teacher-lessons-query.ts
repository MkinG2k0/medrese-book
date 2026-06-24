export function buildTeacherLessonsSearchParams(params: {
	from?: string
	to?: string
	teacher?: string
}): string {
	const search = new URLSearchParams()
	if (params.from) search.set('from', params.from)
	if (params.to) search.set('to', params.to)
	if (params.teacher) search.set('teacher', params.teacher)
	const qs = search.toString()
	return qs ? `?${qs}` : ''
}
