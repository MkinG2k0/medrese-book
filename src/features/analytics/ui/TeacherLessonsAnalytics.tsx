'use client'

import { Select, Table } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ALL_TEACHERS } from '@/features/analytics/lib/analytics-query'
import type { TeacherLessonAnalyticsRow } from '@/features/analytics/lib/teacher-lessons-analytics'
import { buildTeacherLessonsSearchParams } from '@/features/analytics/lib/teacher-lessons-query'

type TeacherLessonsPickerProps = {
	teachers: { id: string; name: string }[]
	selectedTeacher: string
	from: string
	to: string
}

export function TeacherLessonsPicker({
	teachers,
	selectedTeacher,
	from,
	to,
}: TeacherLessonsPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	return (
		<Select
			value={selectedTeacher}
			className="w-full sm:min-w-[220px]"
			options={[
				{ value: ALL_TEACHERS, label: 'Все учителя' },
				...teachers.map((teacher) => ({
					value: teacher.id,
					label: teacher.name,
				})),
			]}
			onChange={(teacher) => {
				router.push(
					`${pathname}${buildTeacherLessonsSearchParams({
						from: searchParams.get('from') ?? from,
						to: searchParams.get('to') ?? to,
						teacher,
					})}`,
				)
			}}
		/>
	)
}

type TeacherLessonsTableProps = {
	rows: TeacherLessonAnalyticsRow[]
	isRange: boolean
	showTeacherColumn?: boolean
}

function formatCell(value: string | null) {
	return value ?? '—'
}

export function TeacherLessonsTable({
	rows,
	isRange,
	showTeacherColumn = true,
}: TeacherLessonsTableProps) {
	const timeSuffix = isRange ? ' (среднее)' : ''

	return (
		<Table
			rowKey="teacherId"
			pagination={false}
			dataSource={rows}
			columns={[
				...(showTeacherColumn
					? [
							{
								title: 'Учитель',
								dataIndex: 'teacherName' as const,
								key: 'teacherName',
							},
						]
					: []),
				{
					title: `Пришел${timeSuffix}`,
					dataIndex: 'loginAt',
					key: 'loginAt',
					render: (value: string | null) => formatCell(value),
				},
				{
					title: `Ушел${timeSuffix}`,
					dataIndex: 'logoutAt',
					key: 'logoutAt',
					render: (value: string | null) => formatCell(value),
				},
				{
					title: `Длительность на раб. месте${isRange ? ' (средняя)' : ''}`,
					dataIndex: 'workplaceDurationLabel',
					key: 'workplaceDurationLabel',
				},
				{
					title: `Начало урока${timeSuffix}`,
					dataIndex: 'lessonStartedAt',
					key: 'lessonStartedAt',
					render: (value: string | null) => formatCell(value),
				},
				{
					title: `Конец урока${timeSuffix}`,
					dataIndex: 'lessonEndedAt',
					key: 'lessonEndedAt',
					render: (value: string | null) => formatCell(value),
				},
				{
					title: `Длительность урока${isRange ? ' (средняя)' : ''}`,
					dataIndex: 'lessonDurationLabel',
					key: 'lessonDurationLabel',
				},
				
			]}
		/>
	)
}
