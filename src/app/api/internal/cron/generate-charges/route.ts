import { currentMonthKey } from '@/shared/lib/accounting/month'
import { dispatchDomainEvent } from '@/shared/lib/domain-events'
import { prisma } from '@/shared/lib/prisma'
import { verifyCronSecret } from '@/shared/lib/verify-cron-secret'
import { success, serverError } from '@/shared/api'

import { generateMonthlyCharges } from '@/features/accounting/lib/generate-monthly-charges'

export async function GET(request: Request) {
	const authError = verifyCronSecret(request)
	if (authError) return authError

	try {
		const month = currentMonthKey()
		const result = await prisma.$transaction(async (tx) => {
			const generated = await generateMonthlyCharges(month, tx)
			await dispatchDomainEvent(
				{
					actorId: 'system',
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
