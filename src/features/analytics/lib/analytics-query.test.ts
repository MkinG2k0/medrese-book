import { describe, expect, it } from 'vitest'

import {
	ALL_GROUPS,
	ALL_TEACHERS,
	resolveAnalyticsGroupFilter,
} from '@/features/analytics/lib/analytics-query'

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
