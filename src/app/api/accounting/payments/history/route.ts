import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { error, success, serverError } from '@/shared/api'
import { z } from 'zod'

import { canReverseForActor } from '@/features/accounting/lib/assert-cashier-cash-method'
import { queryStudentPaymentHistory } from '@/features/accounting/lib/query-student-payment-history'

const historyQuerySchema = z.object({
	studentId: z.string().min(1, 'Укажите ученика'),
})

export async function GET(request: Request) {
	const auth = await authorizeApiRequest({
		allowedRoles: ['ACCOUNTANT', 'CASHIER'],
	})
	if ('error' in auth) return auth.error

	try {
		const url = new URL(request.url)
		const parsed = historyQuerySchema.safeParse({
			studentId: url.searchParams.get('studentId'),
		})
		if (!parsed.success) return error(parsed.error.message)

		const data = await queryStudentPaymentHistory(parsed.data.studentId)
		const role = auth.session.user.role
		return success({
			...data,
			items: data.items.map((item) => ({
				...item,
				canReverse: canReverseForActor(role, item.canReverse),
			})),
		})
	} catch (err) {
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
