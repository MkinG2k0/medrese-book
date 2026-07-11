import { getMyTeacherHoursAnalytics } from '@/features/analytics/actions/teacher-lessons-actions'
import { getAnalyticsGroupsByTeacher } from '@/features/analytics/actions/analytics-actions'
import { ALL_GROUPS, resolveAnalyticsGroupFilter } from '@/features/analytics/lib/analytics-query'
import { MySalaryPage } from '@/features/accounting'
import { getAccountingMonth } from '@/shared/lib/accounting/month'
import { requireRole } from '@/shared/lib/session'

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TeacherMySalaryPage({ searchParams }: PageProps) {
	const session = await requireRole('TEACHER')
	const params = await searchParams
	const urlParams = new URLSearchParams(
		Object.entries(params).flatMap(([key, value]) =>
			value == null ? [] : [[key, String(value)]],
		),
	)
	const month = getAccountingMonth(urlParams)

	const fromParam = urlParams.get('from') ?? undefined
	const toParam = urlParams.get('to') ?? undefined
	const groupIdParam = urlParams.get('groupId') ?? undefined

	const teacherGroups = await getAnalyticsGroupsByTeacher(
		session.user.teacherId!,
	)
	const validGroupIds = teacherGroups.map((group) => group.id)
	const { selectedGroupId } = resolveAnalyticsGroupFilter(
		session.user.teacherId,
		groupIdParam,
		validGroupIds,
	)

	const {
		rows: hoursRows,
		from: hoursFrom,
		to: hoursTo,
		isRange: hoursIsRange,
	} = await getMyTeacherHoursAnalytics(fromParam, toParam, groupIdParam)

	return (
		<MySalaryPage
			month={month}
			hoursRows={hoursRows}
			hoursFrom={hoursFrom}
			hoursTo={hoursTo}
			hoursIsRange={hoursIsRange}
			hoursGroups={teacherGroups}
			selectedGroupId={selectedGroupId ?? ALL_GROUPS}
		/>
	)
}
