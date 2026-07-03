import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { currentMonthKey } from '@/shared/lib/accounting/month'
import { success, error, serverError } from '@/shared/api'
import { monthQuerySchema } from '@/shared/lib/validations/accounting'

import { querySchoolBalanceSummary } from '@/features/accounting/lib/compute-school-balance'

export async function GET(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const url = new URL(request.url)
		const parsed = monthQuerySchema.safeParse({
			month: url.searchParams.get('month') ?? currentMonthKey(),
		})
		if (!parsed.success) return error(parsed.error.message)

		const data = await querySchoolBalanceSummary(parsed.data.month)
		return success(data)
	} catch (err) {
		return serverError(err)
	}
}
