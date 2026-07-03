import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { currentMonthKey } from '@/shared/lib/accounting/month'
import { created, error, success, serverError } from '@/shared/api'
import {
	createTuitionPaymentSchema,
	monthQuerySchema,
} from '@/shared/lib/validations/accounting'

import {
	createTuitionPayment,
	reverseTuitionPayment,
} from '@/features/accounting/lib/accounting-mutations'
import { queryStudentPaymentsForMonth } from '@/features/accounting/lib/query-student-payments'
import { MonthClosedError } from '@/features/accounting/lib/assert-month-open'

export async function GET(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const url = new URL(request.url)
		const parsed = monthQuerySchema.safeParse({
			month: url.searchParams.get('month') ?? currentMonthKey(),
		})
		if (!parsed.success) return error(parsed.error.message)

		const debtorsOnly = url.searchParams.get('debtorsOnly') === '1'
		const data = await queryStudentPaymentsForMonth(parsed.data.month, {
			debtorsOnly,
		})
		return success(data)
	} catch (err) {
		return serverError(err)
	}
}

export async function POST(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const body = await request.json()
		const parsed = createTuitionPaymentSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const payment = await createTuitionPayment({
			...parsed.data,
			actorId: auth.session.user.id,
		})
		return created(payment)
	} catch (err) {
		if (err instanceof MonthClosedError) return error(err.message, 409)
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}

export async function PATCH(request: Request) {
	return error('Редактирование запрещено', 405)
}

export async function DELETE() {
	return error('Удаление запрещено', 405)
}
