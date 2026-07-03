import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { created, error, serverError } from '@/shared/api'
import { closeMonthSchema } from '@/shared/lib/validations/accounting'

import { closeMonth } from '@/features/accounting/lib/accounting-mutations'

export async function POST(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const body = await request.json()
		const parsed = closeMonthSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const closed = await closeMonth(parsed.data.month, auth.session.user.id)
		return created(closed)
	} catch (err) {
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
