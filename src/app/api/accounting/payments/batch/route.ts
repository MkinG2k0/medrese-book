import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { created, error, serverError } from '@/shared/api'
import { createTuitionPaymentsBatchSchema } from '@/shared/lib/validations/accounting'

import { createTuitionPaymentsBatch } from '@/features/accounting/lib/accounting-mutations'
import { MonthClosedError } from '@/features/accounting/lib/assert-month-open'

export async function POST(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const body = await request.json()
		const parsed = createTuitionPaymentsBatchSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const payments = await createTuitionPaymentsBatch({
			...parsed.data,
			actorId: auth.session.user.id,
		})
		return created({ count: payments.length, ids: payments.map((p) => p.id) })
	} catch (err) {
		if (err instanceof MonthClosedError) return error(err.message, 409)
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
