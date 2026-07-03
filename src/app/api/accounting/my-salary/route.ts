import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { currentMonthKey } from '@/shared/lib/accounting/month'
import { success, error, serverError } from '@/shared/api'
import { monthQuerySchema } from '@/shared/lib/validations/accounting'

import { queryTeacherOwnSalary } from '@/features/accounting/lib/query-salaries'

export async function GET(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['TEACHER'] })
	if ('error' in auth) return auth.error

	const teacherId = auth.session.user.teacherId
	if (!teacherId) return error('Профиль учителя не найден', 404)

	try {
		const url = new URL(request.url)
		const parsed = monthQuerySchema.safeParse({
			month: url.searchParams.get('month') ?? currentMonthKey(),
		})
		if (!parsed.success) return error(parsed.error.message)

		const data = await queryTeacherOwnSalary(teacherId, parsed.data.month)
		return success(data)
	} catch (err) {
		return serverError(err)
	}
}
