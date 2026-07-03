import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { created, error, serverError } from '@/shared/api'
import { reverseFinancialRecordSchema } from '@/shared/lib/validations/accounting'

import { reverseExpense } from '@/features/accounting/lib/accounting-mutations'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const { id } = await context.params
		const body = await request.json()
		const parsed = reverseFinancialRecordSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const reversal = await reverseExpense(
			id,
			parsed.data.comment,
			auth.session.user.id,
		)
		return created(reversal)
	} catch (err) {
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
