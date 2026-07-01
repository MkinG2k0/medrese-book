import { getAnalyticsTeachers } from '@/features/analytics/actions/analytics-actions'
import {
	ALL_TEACHERS,
	resolveAnalyticsTeacherFilter,
} from '@/features/analytics/lib/analytics-query'
import { AnalyticsMonthPicker } from '@/features/analytics/ui/AnalyticsMonthPicker'
import { AnalyticsTeacherPicker } from '@/features/analytics/ui/AnalyticsTeacherPicker'
import { AtRiskStudentsTable } from '@/features/analytics/ui/AtRiskStudentsTable'
import { LevelStatsChart } from '@/features/analytics/ui/LevelStats'
import { TopStudents } from '@/features/analytics/ui/TopStudents'
import {
	formatAnalyticsMonth,
	getLevelStats,
	getTopStudents,
	parseAnalyticsMonth,
} from '@/shared/lib/analytics'
import { getAtRiskStudents } from '@/shared/lib/analytics-queries/at-risk-students'
import { requireRoles } from '@/shared/lib/session'
import Title from '@/shared/ui/Title'

type AnalyticsPageProps = {
	searchParams: Promise<{ month?: string; teacher?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
	const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const { month: monthParam, teacher: teacherParam } = await searchParams
	const month = parseAnalyticsMonth(monthParam)
	const monthLabel = formatAnalyticsMonth(month)
	const monthValue = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`

	const allTeachers = await getAnalyticsTeachers()
	const validTeacherIds = new Set(allTeachers.map((teacher) => teacher.id))
	const { filterTeacherId, selectedTeacher } = resolveAnalyticsTeacherFilter(
		session.user.role,
		session.user.teacherId,
		teacherParam,
		validTeacherIds,
	)

	const [atRiskStudents, topStudents, levelStats] = await Promise.all([
		getAtRiskStudents(month, filterTeacherId),
		getTopStudents(month, filterTeacherId),
		getLevelStats(month, filterTeacherId),
	])

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3} className="!mb-0">
					Аналитика
				</Title>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<AnalyticsTeacherPicker
						teachers={allTeachers}
						selectedTeacher={selectedTeacher}
						month={monthValue}
					/>
					<AnalyticsMonthPicker month={month} selectedTeacher={selectedTeacher} />
				</div>
			</div>
			<AtRiskStudentsTable
				data={atRiskStudents}
				monthLabel={monthLabel}
				showTeacherColumn={selectedTeacher === ALL_TEACHERS}
			/>
			<TopStudents data={topStudents} monthLabel={monthLabel} />
			<LevelStatsChart data={levelStats} monthLabel={monthLabel} />
		</div>
	)
}
