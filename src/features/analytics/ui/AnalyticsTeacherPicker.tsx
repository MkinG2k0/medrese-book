'use client'

import { Select } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	ALL_TEACHERS,
	buildAnalyticsSearchParams,
} from '@/features/analytics/lib/analytics-query'

type TeacherOption = {
	id: string
	name: string
}

type AnalyticsTeacherPickerProps = {
	teachers: TeacherOption[]
	selectedTeacher: string
	month: string
	selectedSubjectId: string
}

export function AnalyticsTeacherPicker({
	teachers,
	selectedTeacher,
	month,
	selectedSubjectId,
}: AnalyticsTeacherPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const options = [
		{ value: ALL_TEACHERS, label: 'Все учителя' },
		...teachers.map((teacher) => ({
			value: teacher.id,
			label: teacher.name,
		})),
	]

	return (
		<Select
			value={selectedTeacher}
			options={options}
			onChange={(teacher) => {
				const nextMonth = searchParams.get('month') ?? month
				const subjectId =
					searchParams.get('subjectId') ?? selectedSubjectId
				router.push(
					`${pathname}${buildAnalyticsSearchParams({
						month: nextMonth,
						teacher,
						subjectId,
					})}`,
				)
			}}
			className="w-full sm:w-56"
			disabled={teachers.length === 0}
		/>
	)
}
