'use client'

import { DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	getLocalDateString,
	isFutureCalendarDay,
} from '@/shared/lib/calendar-date'

const { RangePicker } = DatePicker

type TeacherLessonsDateFilterProps = {
	from: string
	to: string
	selectedTeacher?: string
}

function disableFutureDate(current: Dayjs | null): boolean {
	return (
		current != null && isFutureCalendarDay(current.format('YYYY-MM-DD'))
	)
}

export function TeacherLessonsDateFilter({
	from,
	to,
	selectedTeacher,
}: TeacherLessonsDateFilterProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const pushRange = (nextFrom: string, nextTo: string) => {
		const teacher =
			selectedTeacher ?? searchParams.get('teacher') ?? undefined
		const params = new URLSearchParams(searchParams.toString())
		params.set('from', nextFrom)
		params.set('to', nextTo)
		if (teacher) {
			params.set('teacher', teacher)
		} else {
			params.delete('teacher')
		}
		const qs = params.toString()
		router.push(qs ? `${pathname}?${qs}` : pathname)
	}

	return (
		<RangePicker
			value={[dayjs(from), dayjs(to)]}
			format="DD.MM.YYYY"
			allowClear={false}
			disabledDate={disableFutureDate}
			className="w-full sm:w-auto"
			onChange={(dates) => {
				if (!dates?.[0]) {
					const today = getLocalDateString()
					pushRange(today, today)
					return
				}

				const nextFrom = dates[0].format('YYYY-MM-DD')
				const nextTo = (dates[1] ?? dates[0]).format('YYYY-MM-DD')
				pushRange(nextFrom, nextTo)
			}}
		/>
	)
}
