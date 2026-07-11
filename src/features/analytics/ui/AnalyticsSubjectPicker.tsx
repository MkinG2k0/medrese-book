'use client'

import { Select } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { AnalyticsSubjectOption } from '@/features/analytics/actions/analytics-actions'
import {
	ALL_GROUPS,
	ALL_TEACHERS,
	buildAnalyticsSearchParams,
} from '@/features/analytics/lib/analytics-query'
import { writeAnalyticsSubjectId } from '@/features/analytics/lib/analytics-storage'

type AnalyticsSubjectPickerProps = {
	subjects: AnalyticsSubjectOption[]
	selectedSubjectId: string
	month: string
	selectedTeacher: string
}

export function AnalyticsSubjectPicker({
	subjects,
	selectedSubjectId,
	month,
	selectedTeacher,
}: AnalyticsSubjectPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const options = subjects.map((subject) => ({
		value: subject.id,
		label: subject.name,
	}))

	return (
		<Select
			value={selectedSubjectId}
			options={options}
			onChange={(subjectId) => {
				writeAnalyticsSubjectId(subjectId)
				const nextMonth = searchParams.get('month') ?? month
				const teacher = searchParams.get('teacher') ?? selectedTeacher
				const groupId =
					teacher !== ALL_TEACHERS ? ALL_GROUPS : undefined
				router.push(
					`${pathname}${buildAnalyticsSearchParams({
						month: nextMonth,
						teacher,
						groupId,
						subjectId,
					})}`,
				)
			}}
			className="w-full sm:w-56"
			disabled={subjects.length === 0}
			placeholder="Предмет"
			aria-label="Предмет"
		/>
	)
}
