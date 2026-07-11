'use client'

import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	ALL_TEACHERS,
	buildAnalyticsSearchParams,
} from '@/features/analytics/lib/analytics-query'

type AnalyticsMonthPickerProps = {
	month: Date
	selectedTeacher: string
	selectedSubjectId: string
}

export function AnalyticsMonthPicker({
	month,
	selectedTeacher,
	selectedSubjectId,
}: AnalyticsMonthPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	return (
		<DatePicker
			picker="month"
			value={dayjs(month)}
			onChange={(value) => {
				if (!value) return
				const teacher = searchParams.get('teacher') ?? selectedTeacher
				const subjectId =
					searchParams.get('subjectId') ?? selectedSubjectId
				const groupId =
					teacher !== ALL_TEACHERS
						? (searchParams.get('groupId') ?? undefined)
						: undefined
				router.push(
					`${pathname}${buildAnalyticsSearchParams({
						month: value.format('YYYY-MM'),
						teacher,
						groupId,
						subjectId,
					})}`,
				)
			}}
			allowClear={false}
			format="MMMM YYYY"
			className="w-full sm:w-auto"
		/>
	)
}
