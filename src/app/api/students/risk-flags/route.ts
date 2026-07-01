import { endOfMonth, startOfMonth } from 'date-fns'

import { error, success } from '@/shared/api'
import {
	formatAnalyticsMonth,
	parseAnalyticsMonth,
} from '@/shared/lib/analytics'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { isValidCalendarDate } from '@/shared/lib/calendar-date'
import { prisma } from '@/shared/lib/prisma'
import { isJournalVisibleStatus } from '@/shared/lib/student-status'
import { loadStudentMetricsContext } from '@/shared/lib/student-metrics/load-student-metrics'
import { studentRiskFlagsQuerySchema } from '@/entities/student-metrics/model/types'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const parsed = studentRiskFlagsQuerySchema.safeParse({
		groupId: searchParams.get('groupId') ?? undefined,
		date: searchParams.get('date') ?? undefined,
	})
	if (!parsed.success) return error(parsed.error.issues[0]?.message ?? 'Некорректные параметры')

	const { groupId, date } = parsed.data
	if (!isValidCalendarDate(date)) return error('Некорректная дата')

	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
		context: { groupId },
	})
	if ('error' in authResult) return authResult.error

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: {
			students: {
				select: { id: true, status: true },
			},
		},
	})
	if (!group) return error('Группа не найдена', 404)

	const month = parseAnalyticsMonth(date.slice(0, 7))
	const monthLabel = formatAnalyticsMonth(month)
	const dateRange = {
		gte: startOfMonth(month),
		lte: endOfMonth(month),
	}

	const visibleStudents = group.students.filter((student) =>
		isJournalVisibleStatus(student.status),
	)

	const entries = await Promise.all(
		visibleStudents.map(async (student) => {
			const metrics = await loadStudentMetricsContext(
				student.id,
				dateRange,
				monthLabel,
			)
			return {
				studentId: student.id,
				riskFlags: metrics?.riskFlags ?? [],
			}
		}),
	)

	return success(entries)
}
