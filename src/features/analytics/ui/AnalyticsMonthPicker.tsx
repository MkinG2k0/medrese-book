'use client'

import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { buildAnalyticsSearchParams } from '@/features/analytics/lib/analytics-query'

type AnalyticsMonthPickerProps = {
	month: Date
	selectedTeacher: string
}

export function AnalyticsMonthPicker({
	month,
	selectedTeacher,
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
				router.push(
					`${pathname}${buildAnalyticsSearchParams({
						month: value.format('YYYY-MM'),
						teacher,
					})}`,
				)
			}}
			allowClear={false}
			format="MMMM YYYY"
			className="w-full sm:w-auto"
		/>
	)
}
