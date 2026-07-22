import {
	getAnalyticsGroupsByTeacher,
	getAnalyticsSubjects,
	getAnalyticsTeachers,
} from '@/features/analytics/actions/analytics-actions'
import {
	ALL_TEACHERS,
	resolveAnalyticsGroupFilter,
	resolveAnalyticsSubjectFilter,
	resolveAnalyticsTeacherFilter,
} from '@/features/analytics/lib/analytics-query'
import { AnalyticsGroupPicker } from '@/features/analytics/ui/AnalyticsGroupPicker'
import { AnalyticsMonthPicker } from '@/features/analytics/ui/AnalyticsMonthPicker'
import { AnalyticsSubjectPicker } from '@/features/analytics/ui/AnalyticsSubjectPicker'
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
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type AnalyticsPageProps = {
	searchParams: Promise<{
		month?: string
		teacher?: string
		groupId?: string
		subjectId?: string
	}>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
	const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])

	const {
		month: monthParam,
		teacher: teacherParam,
		groupId: groupIdParam,
		subjectId: subjectIdParam,
	} = await searchParams
	const month = parseAnalyticsMonth(monthParam)
	const monthLabel = formatAnalyticsMonth(month)
	const monthValue = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`

	const subjects = await getAnalyticsSubjects()
	const validSubjectIds = subjects.map((subject) => subject.id)
	const { filterSubjectId, selectedSubjectId } = resolveAnalyticsSubjectFilter(
		subjectIdParam,
		validSubjectIds,
	)

	if (!filterSubjectId || !selectedSubjectId) {
		return (
			<div className="flex flex-col gap-8">
				<Title level={3} className="!mb-0">
					Аналитика
				</Title>
				<Text>Нет доступных предметов</Text>
			</div>
		)
	}

	const isTeacher = session.user.role === 'TEACHER'
	const allTeachers = isTeacher ? [] : await getAnalyticsTeachers()
	const validTeacherIds = new Set(allTeachers.map((teacher) => teacher.id))
	const { filterTeacherId, selectedTeacher } = resolveAnalyticsTeacherFilter(
		session.user.role,
		session.user.teacherId,
		teacherParam,
		validTeacherIds,
	)

	const allTeacherGroups = filterTeacherId
		? await getAnalyticsGroupsByTeacher(filterTeacherId)
		: []
	const teacherGroups = allTeacherGroups.filter(
		(group) => group.subjectId === filterSubjectId,
	)
	const validGroupIds = teacherGroups.map((group) => group.id)
	const { filterGroupId, selectedGroupId } = resolveAnalyticsGroupFilter(
		filterTeacherId,
		groupIdParam,
		validGroupIds,
	)

	const [atRiskStudents, topStudents, levelStats] = await Promise.all([
		getAtRiskStudents(
			month,
			filterTeacherId,
			filterGroupId,
			filterSubjectId,
		),
		getTopStudents(month, filterTeacherId, filterGroupId, filterSubjectId),
		getLevelStats(month, filterTeacherId, filterGroupId, filterSubjectId),
	])

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3} className="!mb-0">
					Аналитика
				</Title>
				<div className="flex flex-wrap flex-col gap-2 sm:flex-row sm:items-center">
					<AnalyticsSubjectPicker
						subjects={subjects}
						selectedSubjectId={selectedSubjectId}
						month={monthValue}
						selectedTeacher={selectedTeacher}
					/>
					{!isTeacher && (
						<AnalyticsTeacherPicker
							teachers={allTeachers}
							selectedTeacher={selectedTeacher}
							month={monthValue}
							selectedSubjectId={selectedSubjectId}
						/>
					)}
					<AnalyticsGroupPicker
						groups={teacherGroups}
						selectedTeacher={selectedTeacher}
						selectedGroupId={selectedGroupId}
						month={monthValue}
						selectedSubjectId={selectedSubjectId}
					/>
					<AnalyticsMonthPicker
						month={month}
						selectedTeacher={selectedTeacher}
						selectedSubjectId={selectedSubjectId}
					/>
				</div>
			</div>

			<TopStudents
				data={topStudents}
				monthLabel={monthLabel}
				subjectId={filterSubjectId}
			/>
			<LevelStatsChart data={levelStats} monthLabel={monthLabel} />
			<AtRiskStudentsTable
				data={atRiskStudents}
				monthLabel={monthLabel}
				showTeacherColumn={selectedTeacher === ALL_TEACHERS}
				subjectId={filterSubjectId}
			/>
		</div>
	)
}
