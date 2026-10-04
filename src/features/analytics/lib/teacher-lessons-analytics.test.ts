import { describe, expect, it } from 'vitest'

import { buildTeacherLessonAnalyticsRows } from '@/features/analytics/lib/teacher-lessons-analytics'

describe('buildTeacherLessonAnalyticsRows', () => {
	const teachers = [
		{ id: 't1', userId: 'u1', name: 'Ахмад' },
		{ id: 't2', userId: 'u2', name: 'Ибрагим' },
	]

	const groups = [
		{ id: 'g1', teacherId: 't1', name: 'Группа А', subjectName: 'Коран' },
		{ id: 'g2', teacherId: 't1', name: 'Группа Б', subjectName: 'Основа веры' },
		{ id: 'g3', teacherId: 't2', name: 'Группа В', subjectName: 'Коран' },
	]

	it('builds one teacher row with nested lessons per group', () => {
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

		expect(rows).toHaveLength(2)

		const ahmad = rows.find((row) => row.teacherId === 't1')
		const ibrahim = rows.find((row) => row.teacherId === 't2')
		const quranLesson = ahmad?.lessons.find((lesson) => lesson.groupId === 'g1')
		const aqidahLesson = ahmad?.lessons.find((lesson) => lesson.groupId === 'g2')

		expect(ahmad?.teacherName).toBe('Ахмад')
		expect(ahmad?.lessons).toHaveLength(2)
		expect(quranLesson?.subjectName).toBe('Коран')
		expect(aqidahLesson?.subjectName).toBe('Основа веры')
		expect(ahmad?.loginAt).not.toBeNull()
		expect(ahmad?.logoutAt).not.toBeNull()
		expect(quranLesson?.lessonStartedAt).not.toBeNull()
		expect(quranLesson?.lessonEndedAt).not.toBeNull()
		expect(quranLesson?.lessonDurationLabel).not.toBe('время не учтено')
		expect(ahmad?.totalLessonDurationLabel).not.toBe('время не учтено')
		expect(ahmad?.workplaceDurationLabel).not.toBe('время не учтено')
		expect(ahmad?.loginEventId).toBe('l1')
		expect(ahmad?.logoutEventId).toBe('o1')
		expect(quranLesson?.teachingSessionId).toBe('s1')
		expect(ahmad?.earnedKopecks).toBe(0)

		expect(aqidahLesson?.lessonDurationLabel).toBe('время не учтено')
		expect(ibrahim?.totalLessonDurationLabel).toBe('время не учтено')
		expect(ibrahim?.earnedKopecks).toBe(0)
	})

	it('filters nested lessons by groupId', () => {
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
		expect(rows[0]?.lessons).toHaveLength(1)
		expect(rows[0]?.lessons[0]?.groupId).toBe('g2')
		expect(rows[0]?.lessons[0]?.lessonDurationLabel).toBe('время не учтено')
		expect(rows[0]?.totalLessonDurationLabel).toBe('время не учтено')
	})

	it('marks range rows as averages and sums lessons per day', () => {
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

		const ahmad = rows.find((row) => row.teacherId === 't1')
		const quranLesson = ahmad?.lessons.find((lesson) => lesson.groupId === 'g1')
		expect(ahmad?.isAverage).toBe(true)
		expect(quranLesson?.isAverage).toBe(true)
		expect(ahmad?.loginAt).not.toBeNull()
		expect(ahmad?.logoutAt).not.toBeNull()
		expect(ahmad?.totalLessonDurationLabel).not.toBe('время не учтено')
		expect(ahmad?.workplaceDurationLabel).not.toBe('время не учтено')
	})

	it('multiplies hourly rate by total lesson duration for the day', () => {
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
			null,
			[
				{
					teacherId: 't1',
					hourlyRate: 187_500,
					validFrom: new Date('2026-06-01T12:00:00.000Z'),
				},
			],
		)

		expect(rows[0]?.earnedKopecks).toBe(140_625)
		expect(rows[0]?.earnedLabel).toMatch(/1\s?406/)
		expect(rows[0]?.lessons.find((lesson) => lesson.groupId === 'g1')?.earnedKopecks).toBe(
			140_625,
		)
		expect(rows[0]?.lessons.find((lesson) => lesson.groupId === 'g2')?.earnedKopecks).toBe(0)
	})
})
