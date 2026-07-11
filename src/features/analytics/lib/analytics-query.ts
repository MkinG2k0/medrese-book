import { DEFAULT_QURAN_SUBJECT_ID } from '@/shared/lib/subject-constants'

export const ALL_TEACHERS = 'all'
export const ALL_GROUPS = 'all'
export const ANALYTICS_SUBJECT_PARAM = 'subjectId'

export function buildAnalyticsSearchParams(params: {
	month?: string
	teacher?: string
	groupId?: string
	subjectId?: string
}): string {
	const search = new URLSearchParams()
	if (params.month) search.set('month', params.month)
	if (params.teacher) search.set('teacher', params.teacher)
	if (params.groupId) search.set('groupId', params.groupId)
	if (params.subjectId) search.set(ANALYTICS_SUBJECT_PARAM, params.subjectId)
	const qs = search.toString()
	return qs ? `?${qs}` : ''
}

export function resolveAnalyticsSubjectFilter(
	subjectParam: string | undefined,
	validSubjectIds: string[],
): { filterSubjectId: string | null; selectedSubjectId: string | null } {
	if (validSubjectIds.length === 0) {
		return { filterSubjectId: null, selectedSubjectId: null }
	}

	if (subjectParam && validSubjectIds.includes(subjectParam)) {
		return {
			filterSubjectId: subjectParam,
			selectedSubjectId: subjectParam,
		}
	}

	const sortedIds = [...validSubjectIds].sort()
	const defaultId = validSubjectIds.includes(DEFAULT_QURAN_SUBJECT_ID)
		? DEFAULT_QURAN_SUBJECT_ID
		: sortedIds[0]

	return {
		filterSubjectId: defaultId,
		selectedSubjectId: defaultId,
	}
}

export function resolveAnalyticsTeacherFilter(
	role: string,
	sessionTeacherId: string | null,
	teacherParam?: string,
	validTeacherIds?: Set<string>,
): { filterTeacherId: string | null; selectedTeacher: string } {
	if (teacherParam === ALL_TEACHERS) {
		return { filterTeacherId: null, selectedTeacher: ALL_TEACHERS }
	}

	if (teacherParam) {
		if (!validTeacherIds || validTeacherIds.has(teacherParam)) {
			return { filterTeacherId: teacherParam, selectedTeacher: teacherParam }
		}
	}

	if (role === 'TEACHER' && sessionTeacherId) {
		return {
			filterTeacherId: sessionTeacherId,
			selectedTeacher: sessionTeacherId,
		}
	}

	return { filterTeacherId: null, selectedTeacher: ALL_TEACHERS }
}

export function resolveAnalyticsGroupFilter(
	filterTeacherId: string | null,
	groupParam: string | undefined,
	validGroupIds: string[],
): { filterGroupId: string | null; selectedGroupId: string | null } {
	if (!filterTeacherId || validGroupIds.length === 0) {
		return { filterGroupId: null, selectedGroupId: null }
	}

	if (groupParam === ALL_GROUPS) {
		return { filterGroupId: null, selectedGroupId: ALL_GROUPS }
	}

	if (groupParam && validGroupIds.includes(groupParam)) {
		return { filterGroupId: groupParam, selectedGroupId: groupParam }
	}

	return { filterGroupId: null, selectedGroupId: ALL_GROUPS }
}
