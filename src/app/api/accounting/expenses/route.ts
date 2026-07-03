import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { success, created, error, serverError } from '@/shared/api'
import { createExpenseSchema } from '@/shared/lib/validations/accounting'
import { prisma } from '@/shared/lib/prisma'

import { createExpense } from '@/features/accounting/lib/accounting-mutations'
import { MonthClosedError } from '@/features/accounting/lib/assert-month-open'

export async function GET() {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	const data = await prisma.expense.findMany({
		include: { createdBy: { select: { name: true } } },
		orderBy: { date: 'desc' },
		take: 200,
	})
	return success(data)
}

export async function POST(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const body = await request.json()
		const parsed = createExpenseSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const expense = await createExpense({
			...parsed.data,
			actorId: auth.session.user.id,
		})
		return created(expense)
	} catch (err) {
		if (err instanceof MonthClosedError) return error(err.message, 409)
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
