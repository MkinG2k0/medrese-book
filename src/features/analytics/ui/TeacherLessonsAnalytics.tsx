'use client'

import { Select, Table } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ALL_TEACHERS, ALL_GROUPS } from '@/features/analytics/lib/analytics-query'
import type { TeacherLessonAnalyticsRow } from '@/features/analytics/lib/teacher-lessons-analytics'
import { buildTeacherLessonsSearchParams } from '@/features/analytics/lib/teacher-lessons-query'
import { EditableTeacherTimeCell } from '@/features/analytics/ui/EditableTeacherTimeCell'
import type { TeacherLessonTimeField } from '@/shared/lib/validations/teacher-lesson-time'

type TeacherLessonsGroupOption = {
	id: string
	name: string
}

type TeacherLessonsGroupPickerProps = {
	groups: TeacherLessonsGroupOption[]
	selectedGroupId: string | null
	selectedTeacher?: string
	from: string
	to: string
}

export function TeacherLessonsGroupPicker({
	groups,
	selectedGroupId,
	selectedTeacher,
	from,
	to,
}: TeacherLessonsGroupPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const isAllTeachers = selectedTeacher === ALL_TEACHERS

	return (
		<Select
			value={selectedGroupId ?? undefined}
			className="w-full sm:min-w-[180px]"
			disabled={isAllTeachers || groups.length === 0}
			placeholder="Группа"
			aria-label="Группа"
			options={[
				{ value: ALL_GROUPS, label: 'Все группы' },
				...groups.map((group) => ({
					value: group.id,
					label: group.name,
				})),
			]}
			onChange={(groupId) => {
				router.push(
					`${pathname}${buildTeacherLessonsSearchParams({
						from: searchParams.get('from') ?? from,
						to: searchParams.get('to') ?? to,
						teacher: searchParams.get('teacher') ?? selectedTeacher,
						groupId,
					})}`,
				)
			}}
		/>
	)
}

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
						groupId:
							teacher === ALL_TEACHERS
								? undefined
								: (searchParams.get('groupId') ?? ALL_GROUPS),
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
	editable?: boolean
	date?: string
}

function formatCell(value: string | null) {
	return value ?? '—'
}

function renderTimeCell(
	row: TeacherLessonAnalyticsRow,
	field: TeacherLessonTimeField,
	value: string | null,
	editable: boolean,
	date?: string,
) {
	if (!editable || !date || row.isAverage) {
		return formatCell(value)
	}

	return (
		<EditableTeacherTimeCell
			teacherId={row.teacherId}
			groupId={row.groupId}
			date={date}
			field={field}
			value={value}
		/>
	)
}

export function TeacherLessonsTable({
	rows,
	isRange,
	showTeacherColumn = true,
	editable = false,
	date,
}: TeacherLessonsTableProps) {
	const timeSuffix = isRange ? ' (среднее)' : ''

	return (
		<Table
			rowKey={(row) => `${row.teacherId}-${row.groupId}`}
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
					title: 'Группа',
					dataIndex: 'groupName',
					key: 'groupName',
				},
				{
					title: `Пришел${timeSuffix}`,
					dataIndex: 'loginAt',
					key: 'loginAt',
					render: (value: string | null, row: TeacherLessonAnalyticsRow) =>
						renderTimeCell(row, 'login', value, editable, date),
				},
				{
					title: `Ушел${timeSuffix}`,
					dataIndex: 'logoutAt',
					key: 'logoutAt',
					render: (value: string | null, row: TeacherLessonAnalyticsRow) =>
						renderTimeCell(row, 'logout', value, editable, date),
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
					render: (value: string | null, row: TeacherLessonAnalyticsRow) =>
						renderTimeCell(row, 'lessonStart', value, editable, date),
				},
				{
					title: `Конец урока${timeSuffix}`,
					dataIndex: 'lessonEndedAt',
					key: 'lessonEndedAt',
					render: (value: string | null, row: TeacherLessonAnalyticsRow) =>
						renderTimeCell(row, 'lessonEnd', value, editable, date),
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
