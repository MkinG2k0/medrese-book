import { describe, expect, it } from 'vitest'

import {
	STUDENT_PORTAL_GROUP_PARAM,
	buildStudentPortalHref,
	resolveStudentGroupId,
} from '@/features/student-portal/lib/student-portal-query'

describe('buildStudentPortalHref', () => {
	it('includes groupId in query string when passed', () => {
		const href = buildStudentPortalHref('/student/lessons', 'g1')

		expect(href).toContain(`${STUDENT_PORTAL_GROUP_PARAM}=g1`)
		expect(href).toBe('/student/lessons?groupId=g1')
	})

	it('returns pathname without query when groupId omitted', () => {
		expect(buildStudentPortalHref('/student/lessons')).toBe('/student/lessons')
	})
})

describe('resolveStudentGroupId', () => {
	const allowedIds = ['group-1', 'group-2']
	const fallback = 'group-1'

	it('returns param when it is in allowedIds', () => {
		expect(resolveStudentGroupId('group-2', allowedIds, fallback)).toBe('group-2')
	})

	it('returns fallback when param is invalid', () => {
		expect(resolveStudentGroupId('unknown', allowedIds, fallback)).toBe(fallback)
	})

	it('returns fallback when param is missing', () => {
		expect(resolveStudentGroupId(undefined, allowedIds, fallback)).toBe(fallback)
	})

	it('returns fallback when allowedIds is empty', () => {
		expect(resolveStudentGroupId('group-1', [], fallback)).toBe(fallback)
	})
})
