export const ALL_TEACHERS = 'all'

export function buildAnalyticsSearchParams(params: {
	month?: string
	teacher?: string
}): string {
	const search = new URLSearchParams()
	if (params.month) search.set('month', params.month)
	if (params.teacher) search.set('teacher', params.teacher)
	const qs = search.toString()
	return qs ? `?${qs}` : ''
}

export function resolveAnalyticsTeacherFilter(
	role: string,
	sessionTeacherId: string | null,
	teacherParam?: string,
	validTeacherIds?: Set<string>,
): { filterTeacherId: string | null; selectedTeacher: string } {
	if (role === 'TEACHER') {
		return {
			filterTeacherId: sessionTeacherId,
			selectedTeacher: sessionTeacherId ?? '',
		}
	}

	if (!teacherParam || teacherParam === ALL_TEACHERS) {
		return { filterTeacherId: null, selectedTeacher: ALL_TEACHERS }
	}

	if (validTeacherIds && !validTeacherIds.has(teacherParam)) {
		return { filterTeacherId: null, selectedTeacher: ALL_TEACHERS }
	}

	return { filterTeacherId: teacherParam, selectedTeacher: teacherParam }
}
