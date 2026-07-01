import { error, success } from '@/shared/api'
import {
	formatAnalyticsMonth,
	parseAnalyticsMonth,
} from '@/shared/lib/analytics'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { loadStudentMetricsForMonth } from '@/shared/lib/student-metrics/load-student-metrics'
import { studentMetricsQuerySchema } from '@/entities/student-metrics/model/types'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const parsed = studentMetricsQuerySchema.safeParse({
		studentId: searchParams.get('studentId') ?? undefined,
		month: searchParams.get('month') ?? undefined,
	})
	if (!parsed.success) return error(parsed.error.issues[0]?.message ?? 'Некорректные параметры')

	const { studentId, month: monthParam } = parsed.data

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN', 'STUDENT'],
		context: { studentId },
	})
	if ('error' in authResult) return authResult.error

	const month = parseAnalyticsMonth(monthParam)
	const monthLabel = formatAnalyticsMonth(month)

	const metrics = await loadStudentMetricsForMonth(studentId, month, monthLabel)
	if (!metrics) return error('Ученик не найден', 404)

	return success({
		lessonsCount: metrics.periodMetrics.lessonsCount,
		stepsCount: metrics.periodMetrics.stepsCount,
		totalMinutes: metrics.periodMetrics.totalMinutes,
		levelProgress: metrics.levelProgress,
	})
}
