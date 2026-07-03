import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { created, error, serverError } from '@/shared/api'
import { createSalaryPayoutSchema } from '@/shared/lib/validations/accounting'

import { createSalaryPayout } from '@/features/accounting/lib/accounting-mutations'
import { MonthClosedError } from '@/features/accounting/lib/assert-month-open'

export async function POST(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const body = await request.json()
		const parsed = createSalaryPayoutSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const payout = await createSalaryPayout({
			...parsed.data,
			actorId: auth.session.user.id,
		})
		return created(payout)
	} catch (err) {
		if (err instanceof MonthClosedError) return error(err.message, 409)
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
