import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import { currentMonthKey } from '@/shared/lib/accounting/month'
import { success, error, serverError } from '@/shared/api'
import { generateChargesSchema } from '@/shared/lib/validations/accounting'

import { generateMonthlyCharges } from '@/features/accounting/lib/generate-monthly-charges'

export async function POST(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const body = await request.json().catch(() => ({}))
		const parsed = generateChargesSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const month = parsed.data.month ?? currentMonthKey()
		const result = await prisma.$transaction(async (tx) => {
			const generated = await generateMonthlyCharges(month, tx)
			await dispatchDomainEvent(
				{
					actorId: auth.session.user.id,
					action: 'TUITION_CHARGES_GENERATED',
					entityType: 'TuitionCharge',
					entityId: month,
					payload: generated,
				},
				tx,
			)
			return generated
		})

		return success(result)
	} catch (err) {
		return serverError(err)
	}
}
