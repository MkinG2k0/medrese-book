import {
	getAnalyticsGroupsByTeacher,
	getAnalyticsTeachers,
} from '@/features/analytics/actions/analytics-actions'
import { getTeacherLessonAnalytics } from '@/features/analytics/actions/teacher-lessons-actions'
import {
	ALL_GROUPS,
	ALL_TEACHERS,
	resolveAnalyticsGroupFilter,
	resolveAnalyticsTeacherFilter,
} from '@/features/analytics/lib/analytics-query'
import {
	TeacherLessonsGroupPicker,
	TeacherLessonsPicker,
	TeacherLessonsTable,
} from '@/features/analytics/ui/TeacherLessonsAnalytics'
import { TeacherLessonsDateFilter } from '@/features/analytics/ui/TeacherLessonsDateFilter'
import { requireRoles } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type TeacherLessonsAnalyticsPageProps = {
	searchParams: Promise<{ from?: string; to?: string; teacher?: string; groupId?: string }>
}

export default async function TeacherLessonsAnalyticsPage({
	searchParams,
}: TeacherLessonsAnalyticsPageProps) {
	const session = await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	const { from: fromParam, to: toParam, teacher: teacherParam, groupId: groupIdParam } =
		await searchParams

	const allTeachers = await getAnalyticsTeachers()
	const validTeacherIds = new Set(allTeachers.map((teacher) => teacher.id))
	const { filterTeacherId, selectedTeacher } = resolveAnalyticsTeacherFilter(
		session.user.role,
		null,
		teacherParam,
		validTeacherIds,
	)

	const teacherFilter =
		selectedTeacher === ALL_TEACHERS ? null : filterTeacherId

	const teacherGroups = filterTeacherId
		? await getAnalyticsGroupsByTeacher(filterTeacherId)
		: []
	const validGroupIds = teacherGroups.map((group) => group.id)
	const { selectedGroupId } = resolveAnalyticsGroupFilter(
		filterTeacherId,
		groupIdParam,
		validGroupIds,
	)

	const { rows, from, to, isRange } = await getTeacherLessonAnalytics(
		fromParam,
		toParam,
		teacherFilter,
		groupIdParam,
	)

	const periodLabel = isRange
		? `с ${from} по ${to} (средние значения)`
		: from

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Title level={3} className="!mb-1">
						Аналитика учителей
					</Title>
					<Text type="secondary">Период: {periodLabel}</Text>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<TeacherLessonsPicker
						teachers={allTeachers}
						selectedTeacher={selectedTeacher}
						from={from}
						to={to}
					/>
					<TeacherLessonsGroupPicker
						groups={teacherGroups}
						selectedGroupId={selectedGroupId ?? ALL_GROUPS}
						selectedTeacher={selectedTeacher}
						from={from}
						to={to}
					/>
					<TeacherLessonsDateFilter
						from={from}
						to={to}
						selectedTeacher={selectedTeacher}
						selectedGroupId={selectedGroupId ?? ALL_GROUPS}
					/>
				</div>
			</div>

			<TeacherLessonsTable
				rows={rows}
				isRange={isRange}
				editable={!isRange}
				date={from}
			/>
		</div>
	)
}
