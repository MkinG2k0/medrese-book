import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { currentMonthKey } from '@/shared/lib/accounting/month'
import { success, error, serverError } from '@/shared/api'
import { monthQuerySchema } from '@/shared/lib/validations/accounting'

import {
	querySalariesForMonth,
	queryTeacherLessonsForMonth,
} from '@/features/accounting/lib/query-salaries'

export async function GET(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const url = new URL(request.url)
		const month = url.searchParams.get('month') ?? currentMonthKey()
		const teacherId = url.searchParams.get('teacherId')

		if (teacherId) {
			const parsed = monthQuerySchema.safeParse({ month })
			if (!parsed.success) return error(parsed.error.message)
			const lessons = await queryTeacherLessonsForMonth(
				teacherId,
				parsed.data.month,
			)
			return success(lessons)
		}

		const parsed = monthQuerySchema.safeParse({ month })
		if (!parsed.success) return error(parsed.error.message)
		const data = await querySalariesForMonth(parsed.data.month)
		return success(data)
	} catch (err) {
		return serverError(err)
	}
}
