import { describe, expect, it } from 'vitest'

import {
	ALL_GROUPS,
	ALL_TEACHERS,
	ANALYTICS_SUBJECT_PARAM,
	buildAnalyticsSearchParams,
	resolveAnalyticsGroupFilter,
	resolveAnalyticsSubjectFilter,
	resolveAnalyticsTeacherFilter,
} from '@/features/analytics/lib/analytics-query'
import { DEFAULT_QURAN_SUBJECT_ID } from '@/shared/lib/subject-constants'

describe('buildAnalyticsSearchParams', () => {
	it('includes subjectId in query string when passed', () => {
		const qs = buildAnalyticsSearchParams({
			month: '2026-07',
			teacher: 'teacher-1',
			groupId: 'group-1',
			subjectId: 'subject-1',
		})

		expect(qs).toContain(`${ANALYTICS_SUBJECT_PARAM}=subject-1`)
		expect(qs).toContain('month=2026-07')
		expect(qs).toContain('teacher=teacher-1')
		expect(qs).toContain('groupId=group-1')
	})

	it('omits subjectId when not passed', () => {
		const qs = buildAnalyticsSearchParams({ month: '2026-07' })

		expect(qs).not.toContain(ANALYTICS_SUBJECT_PARAM)
	})
})

describe('resolveAnalyticsSubjectFilter', () => {
	const quranId = DEFAULT_QURAN_SUBJECT_ID
	const otherId = 'subject-arabic'

	it('uses valid subject param from URL', () => {
		expect(resolveAnalyticsSubjectFilter(otherId, [quranId, otherId])).toEqual({
			filterSubjectId: otherId,
			selectedSubjectId: otherId,
		})
	})

	it('defaults to DEFAULT_QURAN_SUBJECT_ID when param is invalid', () => {
		expect(resolveAnalyticsSubjectFilter('unknown', [quranId, otherId])).toEqual({
			filterSubjectId: quranId,
			selectedSubjectId: quranId,
		})
	})

	it('defaults to DEFAULT_QURAN_SUBJECT_ID when param is missing', () => {
		expect(resolveAnalyticsSubjectFilter(undefined, [quranId, otherId])).toEqual({
			filterSubjectId: quranId,
			selectedSubjectId: quranId,
		})
	})

	it('uses first sorted id when DEFAULT_QURAN not in list', () => {
		const ids = ['subject-z', 'subject-a']
		expect(resolveAnalyticsSubjectFilter(undefined, ids)).toEqual({
			filterSubjectId: 'subject-a',
			selectedSubjectId: 'subject-a',
		})
	})

	it('returns null when validSubjectIds is empty', () => {
		expect(resolveAnalyticsSubjectFilter(undefined, [])).toEqual({
			filterSubjectId: null,
			selectedSubjectId: null,
		})
	})
})

describe('resolveAnalyticsGroupFilter', () => {
	const groupIds = ['group-1', 'group-2']

	it('returns null when all teachers selected', () => {
		expect(resolveAnalyticsGroupFilter(null, undefined, groupIds)).toEqual({
			filterGroupId: null,
			selectedGroupId: null,
		})
	})

	it('defaults to all groups when teacher selected without group param', () => {
		expect(
			resolveAnalyticsGroupFilter('teacher-1', undefined, groupIds),
		).toEqual({
			filterGroupId: null,
			selectedGroupId: ALL_GROUPS,
		})
	})

	it('uses valid groupId from URL', () => {
		expect(
			resolveAnalyticsGroupFilter('teacher-1', 'group-2', groupIds),
		).toEqual({
			filterGroupId: 'group-2',
			selectedGroupId: 'group-2',
		})
	})

	it('falls back to all groups when group param is invalid', () => {
		expect(
			resolveAnalyticsGroupFilter('teacher-1', 'unknown', groupIds),
		).toEqual({
			filterGroupId: null,
			selectedGroupId: ALL_GROUPS,
		})
	})

	it('returns null when teacher has no groups', () => {
		expect(resolveAnalyticsGroupFilter('teacher-1', undefined, [])).toEqual({
			filterGroupId: null,
			selectedGroupId: null,
		})
	})

	it('selects all groups when group param is ALL_GROUPS', () => {
		expect(
			resolveAnalyticsGroupFilter('teacher-1', ALL_GROUPS, groupIds),
		).toEqual({
			filterGroupId: null,
			selectedGroupId: ALL_GROUPS,
		})
	})
})

describe('ALL_TEACHERS', () => {
	it('is stable sentinel value', () => {
		expect(ALL_TEACHERS).toBe('all')
	})
})

describe('resolveAnalyticsTeacherFilter', () => {
	const sessionTeacherId = 'teacher-self'
	const validTeacherIds = new Set(['teacher-self', 'teacher-other'])

	it('locks TEACHER to session teacher even when teacher=all', () => {
		expect(
			resolveAnalyticsTeacherFilter(
				'TEACHER',
				sessionTeacherId,
				ALL_TEACHERS,
				validTeacherIds,
			),
		).toEqual({
			filterTeacherId: sessionTeacherId,
			selectedTeacher: sessionTeacherId,
		})
	})

	it('locks TEACHER to session teacher when another teacher id is passed', () => {
		expect(
			resolveAnalyticsTeacherFilter(
				'TEACHER',
				sessionTeacherId,
				'teacher-other',
				validTeacherIds,
			),
		).toEqual({
			filterTeacherId: sessionTeacherId,
			selectedTeacher: sessionTeacherId,
		})
	})

	it('allows MANAGER to select all teachers', () => {
		expect(
			resolveAnalyticsTeacherFilter(
				'MANAGER',
				null,
				ALL_TEACHERS,
				validTeacherIds,
			),
		).toEqual({
			filterTeacherId: null,
			selectedTeacher: ALL_TEACHERS,
		})
	})

	it('allows MANAGER to select a specific teacher', () => {
		expect(
			resolveAnalyticsTeacherFilter(
				'MANAGER',
				null,
				'teacher-other',
				validTeacherIds,
			),
		).toEqual({
			filterTeacherId: 'teacher-other',
			selectedTeacher: 'teacher-other',
		})
	})
})
