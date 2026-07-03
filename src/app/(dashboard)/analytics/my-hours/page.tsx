import { getMyTeacherHoursAnalytics } from '@/features/analytics/actions/teacher-lessons-actions'
import { TeacherLessonsTable } from '@/features/analytics/ui/TeacherLessonsAnalytics'
import { TeacherLessonsDateFilter } from '@/features/analytics/ui/TeacherLessonsDateFilter'
import { requireRole } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type MyTeacherHoursPageProps = {
	searchParams: Promise<{ from?: string; to?: string }>
}

export default async function MyTeacherHoursPage({
	searchParams,
}: MyTeacherHoursPageProps) {
	await requireRole('TEACHER')
	const { from: fromParam, to: toParam } = await searchParams

	const { rows, from, to, isRange } = await getMyTeacherHoursAnalytics(
		fromParam,
		toParam,
	)

	const periodLabel = isRange
		? `с ${from} по ${to} (средние значения)`
		: from

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Title level={3} className="!mb-1">
						Мои часы
					</Title>
					<Text type="secondary">Период: {periodLabel}</Text>
				</div>
				<TeacherLessonsDateFilter from={from} to={to} />
			</div>

			<TeacherLessonsTable
				rows={rows}
				isRange={isRange}
				showTeacherColumn={false}
			/>
		</div>
	)
}
