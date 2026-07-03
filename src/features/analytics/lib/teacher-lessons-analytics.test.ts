import { describe, expect, it } from 'vitest'

import { buildTeacherLessonAnalyticsRows } from '@/features/analytics/lib/teacher-lessons-analytics'

describe('buildTeacherLessonAnalyticsRows', () => {
	const teachers = [
		{ id: 't1', userId: 'u1', name: 'Ахмад' },
		{ id: 't2', userId: 'u2', name: 'Ибрагим' },
	]

	it('builds single-day row with lesson and login times', () => {
		const rows = buildTeacherLessonAnalyticsRows(
			teachers,
			[
				{
					teacherId: 't1',
					startedAt: new Date('2026-06-25T07:30:00.000Z'),
					endedAt: new Date('2026-06-25T08:15:00.000Z'),
					date: new Date('2026-06-25T12:00:00.000Z'),
				},
			],
			[
				{
					userId: 'u1',
					createdAt: new Date('2026-06-25T07:00:00.000Z'),
				},
			],
			[
				{
					userId: 'u1',
					createdAt: new Date('2026-06-25T08:30:00.000Z'),
				},
			],
			'2026-06-25',
			'2026-06-25',
		)

		expect(rows[0]?.teacherName).toBe('Ахмад')
		expect(rows[0]?.loginAt).not.toBeNull()
		expect(rows[0]?.logoutAt).not.toBeNull()
		expect(rows[0]?.lessonStartedAt).not.toBeNull()
		expect(rows[0]?.lessonEndedAt).not.toBeNull()
		expect(rows[0]?.lessonDurationLabel).not.toBe('время не учтено')
		expect(rows[0]?.workplaceDurationLabel).not.toBe('время не учтено')
		expect(rows[1]?.lessonDurationLabel).toBe('время не учтено')
	})

	it('marks range rows as averages', () => {
		const rows = buildTeacherLessonAnalyticsRows(
			teachers,
			[
				{
					teacherId: 't1',
					startedAt: new Date('2026-06-24T07:30:00.000Z'),
					endedAt: new Date('2026-06-24T08:00:00.000Z'),
					date: new Date('2026-06-24T12:00:00.000Z'),
				},
				{
					teacherId: 't1',
					startedAt: new Date('2026-06-25T08:30:00.000Z'),
					endedAt: new Date('2026-06-25T09:30:00.000Z'),
					date: new Date('2026-06-25T12:00:00.000Z'),
				},
			],
			[
				{
					userId: 'u1',
					createdAt: new Date('2026-06-24T07:00:00.000Z'),
				},
				{
					userId: 'u1',
					createdAt: new Date('2026-06-25T08:00:00.000Z'),
				},
			],
			[
				{
					userId: 'u1',
					createdAt: new Date('2026-06-24T08:30:00.000Z'),
				},
				{
					userId: 'u1',
					createdAt: new Date('2026-06-25T10:00:00.000Z'),
				},
			],
			'2026-06-24',
			'2026-06-25',
		)

		expect(rows[0]?.isAverage).toBe(true)
		expect(rows[0]?.loginAt).not.toBeNull()
		expect(rows[0]?.logoutAt).not.toBeNull()
		expect(rows[0]?.lessonDurationLabel).not.toBe('время не учтено')
		expect(rows[0]?.workplaceDurationLabel).not.toBe('время не учтено')
	})
})
