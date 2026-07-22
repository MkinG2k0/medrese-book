'use client'

import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type AccountingMonthPickerProps = {
	month: string
}

export function AccountingMonthPicker({ month }: AccountingMonthPickerProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	return (
		<DatePicker
			picker="month"
			value={dayjs(`${month}-01`)}
			inputReadOnly
			onChange={(value) => {
				if (!value) return
				const params = new URLSearchParams(searchParams.toString())
				params.set('month', value.format('YYYY-MM'))
				router.push(`${pathname}?${params.toString()}`)
			}}
			allowClear={false}
			format="MMMM YYYY"
			className="w-full sm:w-auto"
		/>
	)
}
