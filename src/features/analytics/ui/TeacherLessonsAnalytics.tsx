'use client'

import { Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ALL_TEACHERS, ALL_GROUPS } from '@/features/analytics/lib/analytics-query'
import type {
	TeacherLessonAnalyticsRow,
	TeacherLessonSubjectRow,
} from '@/features/analytics/lib/teacher-lessons-analytics'
import { buildTeacherLessonsSearchParams } from '@/features/analytics/lib/teacher-lessons-query'
import { EditableTeacherTimeCell } from '@/features/analytics/ui/EditableTeacherTimeCell'
import type { TeacherLessonTimeField } from '@/shared/lib/validations/teacher-lesson-time'

const SUBJECT_COLUMN_WIDTH = 180
const TIME_COLUMN_WIDTH = 120
const DURATION_COLUMN_WIDTH = 200
const TABLE_SCROLL_X = 880
const EXPANDED_TABLE_SCROLL_X = 760

type TeacherLessonsGroupOption = {
	id: string
	name: string
	subjectName?: string
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
			className="w-full min-w-0"
			disabled={isAllTeachers || groups.length === 0}
			placeholder="Группа"
			aria-label="Группа"
			options={[
				{ value: ALL_GROUPS, label: 'Все группы' },
				...groups.map((group) => ({
					value: group.id,
					label: group.subjectName
						? `${group.name} — ${group.subjectName}`
						: group.name,
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
			className="w-full min-w-0"
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

function renderTeacherTimeCell(
	row: TeacherLessonAnalyticsRow,
	field: Extract<TeacherLessonTimeField, 'login' | 'logout'>,
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
			date={date}
			field={field}
			value={value}
		/>
	)
}

function renderLessonTimeCell(
	row: TeacherLessonSubjectRow,
	field: Extract<TeacherLessonTimeField, 'lessonStart' | 'lessonEnd'>,
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

function TeacherLessonsExpandedTable({
	lessons,
	isRange,
	editable,
	date,
}: {
	lessons: TeacherLessonSubjectRow[]
	isRange: boolean
	editable: boolean
	date?: string
}) {
	const timeSuffix = isRange ? ' (среднее)' : ''
	const columns: TableColumnsType<TeacherLessonSubjectRow> = [
		{
			title: 'Предмет',
			dataIndex: 'subjectName',
			key: 'subjectName',
			width: SUBJECT_COLUMN_WIDTH,
		},
		{
			title: 'Группа',
			dataIndex: 'groupName',
			key: 'groupName',
		},
		{
			title: `Начало урока${timeSuffix}`,
			dataIndex: 'lessonStartedAt',
			key: 'lessonStartedAt',
			width: TIME_COLUMN_WIDTH,
			render: (value: string | null, row) =>
				renderLessonTimeCell(row, 'lessonStart', value, editable, date),
		},
		{
			title: `Конец урока${timeSuffix}`,
			dataIndex: 'lessonEndedAt',
			key: 'lessonEndedAt',
			width: TIME_COLUMN_WIDTH,
			render: (value: string | null, row) =>
				renderLessonTimeCell(row, 'lessonEnd', value, editable, date),
		},
		{
			title: `Длительность урока${isRange ? ' (средняя)' : ''}`,
			dataIndex: 'lessonDurationLabel',
			key: 'lessonDurationLabel',
			width: DURATION_COLUMN_WIDTH,
		},
	]

	return (
		<div className="min-w-0 max-w-full">
			<Table<TeacherLessonSubjectRow>
				rowKey={(row) => `${row.teacherId}-${row.groupId}`}
				pagination={false}
				size="small"
				scroll={{ x: EXPANDED_TABLE_SCROLL_X }}
				dataSource={lessons}
				columns={columns}
			/>
		</div>
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
	const columns: TableColumnsType<TeacherLessonAnalyticsRow> = [
		...(showTeacherColumn
			? [
					{
						title: 'Учитель',
						dataIndex: 'teacherName' as const,
						key: 'teacherName',
						width: SUBJECT_COLUMN_WIDTH,
					},
				]
			: []),
		{
			title: `Пришел${timeSuffix}`,
			dataIndex: 'loginAt',
			key: 'loginAt',
			width: TIME_COLUMN_WIDTH,
			render: (value: string | null, row) =>
				renderTeacherTimeCell(row, 'login', value, editable, date),
		},
		{
			title: `Ушел${timeSuffix}`,
			dataIndex: 'logoutAt',
			key: 'logoutAt',
			width: TIME_COLUMN_WIDTH,
			render: (value: string | null, row) =>
				renderTeacherTimeCell(row, 'logout', value, editable, date),
		},
		{
			title: `Длительность на раб. месте${isRange ? ' (средняя)' : ''}`,
			dataIndex: 'workplaceDurationLabel',
			key: 'workplaceDurationLabel',
			width: DURATION_COLUMN_WIDTH,
		},
		{
			title: `Длительность всех уроков${isRange ? ' (средняя)' : ''}`,
			dataIndex: 'totalLessonDurationLabel',
			key: 'totalLessonDurationLabel',
			width: DURATION_COLUMN_WIDTH,
		},
	]

	return (
		<div className="min-w-0 max-w-full">
			<Table<TeacherLessonAnalyticsRow>
				rowKey={(row) => row.teacherId}
				pagination={false}
				scroll={{ x: TABLE_SCROLL_X }}
				dataSource={rows}
				columns={columns}
				expandable={{
					rowExpandable: (row) => row.lessons.length > 0,
					expandedRowRender: (row) => (
						<TeacherLessonsExpandedTable
							lessons={row.lessons}
							isRange={isRange}
							editable={editable}
							date={date}
						/>
					),
				}}
			/>
		</div>
	)
}
