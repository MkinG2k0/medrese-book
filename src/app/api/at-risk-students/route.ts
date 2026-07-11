import { error, forbidden, success } from '@/shared/api'
import { getAtRiskStudents, parseAnalyticsMonth } from '@/shared/lib/analytics'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { prisma } from '@/shared/lib/prisma'
import { getAnalyticsSubjects } from '@/features/analytics/actions/analytics-actions'
import {
	resolveAnalyticsSubjectFilter,
	resolveAnalyticsTeacherFilter,
} from '@/features/analytics/lib/analytics-query'
import { atRiskStudentsQuerySchema } from '@/entities/student-metrics/model/types'

export async function GET(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const { searchParams } = new URL(request.url)
	const parsed = atRiskStudentsQuerySchema.safeParse({
		month: searchParams.get('month') ?? undefined,
		teacher: searchParams.get('teacher') ?? undefined,
		subjectId: searchParams.get('subjectId') ?? undefined,
	})
	if (!parsed.success) return error(parsed.error.issues[0]?.message ?? 'Некорректные параметры')

	const { month: monthParam, teacher: teacherParam, subjectId } = parsed.data
	const month = parseAnalyticsMonth(monthParam)

	const subjects = await getAnalyticsSubjects()
	const validSubjectIds = subjects.map((subject) => subject.id)
	const { filterSubjectId } = resolveAnalyticsSubjectFilter(
		subjectId,
		validSubjectIds,
	)
	if (!filterSubjectId || filterSubjectId !== subjectId) {
		return forbidden()
	}

	const teachers = await prisma.teacher.findMany({
		select: { id: true },
	})
	const validTeacherIds = new Set(teachers.map((teacher) => teacher.id))

	const { filterTeacherId } = resolveAnalyticsTeacherFilter(
		authResult.session.user.role,
		authResult.session.user.teacherId,
		teacherParam,
		validTeacherIds,
	)

	const data = await getAtRiskStudents(
		month,
		filterTeacherId,
		null,
		filterSubjectId,
	)
	return success(data)
}
