import { getMyTeacherHoursAnalytics } from '@/features/analytics/actions/teacher-lessons-actions'
import { MySalaryPage } from '@/features/accounting'
import { getAccountingMonth } from '@/shared/lib/accounting/month'
import { requireRole } from '@/shared/lib/session'

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TeacherMySalaryPage({ searchParams }: PageProps) {
	await requireRole('TEACHER')
	const params = await searchParams
	const urlParams = new URLSearchParams(
		Object.entries(params).flatMap(([key, value]) =>
			value == null ? [] : [[key, String(value)]],
		),
	)
	const month = getAccountingMonth(urlParams)

	const fromParam = urlParams.get('from') ?? undefined
	const toParam = urlParams.get('to') ?? undefined
	const {
		rows: hoursRows,
		from: hoursFrom,
		to: hoursTo,
		isRange: hoursIsRange,
	} = await getMyTeacherHoursAnalytics(fromParam, toParam)

	return (
		<MySalaryPage
			month={month}
			hoursRows={hoursRows}
			hoursFrom={hoursFrom}
			hoursTo={hoursTo}
			hoursIsRange={hoursIsRange}
		/>
	)
}
