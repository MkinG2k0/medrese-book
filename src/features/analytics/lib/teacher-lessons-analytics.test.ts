import { describe, expect, it } from 'vitest'

import { buildTeacherLessonAnalyticsRows } from '@/features/analytics/lib/teacher-lessons-analytics'

describe('buildTeacherLessonAnalyticsRows', () => {
	const teachers = [
		{ id: 't1', userId: 'u1', name: 'Ахмад' },
		{ id: 't2', userId: 'u2', name: 'Ибрагим' },
	]

	const groups = [
		{ id: 'g1', teacherId: 't1', name: 'Группа А' },
		{ id: 'g2', teacherId: 't1', name: 'Группа Б' },
		{ id: 'g3', teacherId: 't2', name: 'Группа В' },
	]

	it('builds single-day row with lesson and login times per group', () => {
		const rows = buildTeacherLessonAnalyticsRows(
			teachers,
			groups,
			[
				{
					id: 's1',
					teacherId: 't1',
					groupId: 'g1',
					startedAt: new Date('2026-06-25T07:30:00.000Z'),
					endedAt: new Date('2026-06-25T08:15:00.000Z'),
					date: new Date('2026-06-25T12:00:00.000Z'),
				},
			],
			[
				{
					id: 'l1',
					userId: 'u1',
					createdAt: new Date('2026-06-25T07:00:00.000Z'),
				},
			],
			[
				{
					id: 'o1',
					userId: 'u1',
					createdAt: new Date('2026-06-25T08:30:00.000Z'),
				},
			],
			'2026-06-25',
			'2026-06-25',
		)

		const groupARow = rows.find((row) => row.groupId === 'g1')
		const groupBRow = rows.find((row) => row.groupId === 'g2')

		expect(groupARow?.teacherName).toBe('Ахмад')
		expect(groupARow?.groupName).toBe('Группа А')
		expect(groupARow?.loginAt).not.toBeNull()
		expect(groupARow?.logoutAt).not.toBeNull()
		expect(groupARow?.lessonStartedAt).not.toBeNull()
		expect(groupARow?.lessonEndedAt).not.toBeNull()
		expect(groupARow?.lessonDurationLabel).not.toBe('время не учтено')
		expect(groupARow?.workplaceDurationLabel).not.toBe('время не учтено')
		expect(groupARow?.loginEventId).toBe('l1')
		expect(groupARow?.logoutEventId).toBe('o1')
		expect(groupARow?.teachingSessionId).toBe('s1')

		expect(groupBRow?.lessonDurationLabel).toBe('время не учтено')
		expect(rows.find((row) => row.teacherId === 't2')?.lessonDurationLabel).toBe(
			'время не учтено',
		)
	})

	it('filters rows by groupId', () => {
		const rows = buildTeacherLessonAnalyticsRows(
			[teachers[0]!],
			groups,
			[
				{
					id: 's1',
					teacherId: 't1',
					groupId: 'g1',
					startedAt: new Date('2026-06-25T07:30:00.000Z'),
					endedAt: new Date('2026-06-25T08:15:00.000Z'),
					date: new Date('2026-06-25T12:00:00.000Z'),
				},
			],
			[],
			[],
			'2026-06-25',
			'2026-06-25',
			'g2',
		)

		expect(rows).toHaveLength(1)
		expect(rows[0]?.groupId).toBe('g2')
		expect(rows[0]?.lessonDurationLabel).toBe('время не учтено')
	})

	it('marks range rows as averages', () => {
		const rows = buildTeacherLessonAnalyticsRows(
			teachers,
			groups,
			[
				{
					id: 's1',
					teacherId: 't1',
					groupId: 'g1',
					startedAt: new Date('2026-06-24T07:30:00.000Z'),
					endedAt: new Date('2026-06-24T08:00:00.000Z'),
					date: new Date('2026-06-24T12:00:00.000Z'),
				},
				{
					id: 's2',
					teacherId: 't1',
					groupId: 'g1',
					startedAt: new Date('2026-06-25T08:30:00.000Z'),
					endedAt: new Date('2026-06-25T09:30:00.000Z'),
					date: new Date('2026-06-25T12:00:00.000Z'),
				},
			],
			[
				{
					id: 'l1',
					userId: 'u1',
					createdAt: new Date('2026-06-24T07:00:00.000Z'),
				},
				{
					id: 'l2',
					userId: 'u1',
					createdAt: new Date('2026-06-25T08:00:00.000Z'),
				},
			],
			[
				{
					id: 'o1',
					userId: 'u1',
					createdAt: new Date('2026-06-24T08:30:00.000Z'),
				},
				{
					id: 'o2',
					userId: 'u1',
					createdAt: new Date('2026-06-25T10:00:00.000Z'),
				},
			],
			'2026-06-24',
			'2026-06-25',
		)

		const groupARow = rows.find((row) => row.groupId === 'g1')
		expect(groupARow?.isAverage).toBe(true)
		expect(groupARow?.loginAt).not.toBeNull()
		expect(groupARow?.logoutAt).not.toBeNull()
		expect(groupARow?.lessonDurationLabel).not.toBe('время не учтено')
		expect(groupARow?.workplaceDurationLabel).not.toBe('время не учтено')
	})
})
