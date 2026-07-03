import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { success, error, serverError } from '@/shared/api'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'

import { confirmSalaryAccrual } from '@/features/accounting/lib/salary-accrual'
import { SalaryAccrualBlockedError } from '@/features/accounting/lib/salary-accrual'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const { id } = await context.params
		const accrual = await prisma.$transaction(async (tx) => {
			const confirmed = await confirmSalaryAccrual(id, tx)
			await dispatchDomainEvent(
				{
					actorId: auth.session.user.id,
					action: 'SALARY_ACCRUAL_CONFIRMED',
					entityType: 'SalaryAccrual',
					entityId: id,
					payload: { teacherId: confirmed.teacherId, month: confirmed.month },
				},
				tx,
			)
			return confirmed
		})
		return success(accrual)
	} catch (err) {
		if (err instanceof SalaryAccrualBlockedError) return error(err.message, 409)
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
