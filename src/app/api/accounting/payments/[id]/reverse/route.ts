import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { created, error, serverError } from '@/shared/api'
import { reverseFinancialRecordSchema } from '@/shared/lib/validations/accounting'

import { reverseTuitionPayment } from '@/features/accounting/lib/accounting-mutations'
import { MonthClosedError } from '@/features/accounting/lib/assert-month-open'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const { id } = await context.params
		const body = await request.json()
		const parsed = reverseFinancialRecordSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const reversal = await reverseTuitionPayment(
			id,
			parsed.data.comment,
			auth.session.user.id,
		)
		return created(reversal)
	} catch (err) {
		if (err instanceof MonthClosedError) return error(err.message, 409)
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
