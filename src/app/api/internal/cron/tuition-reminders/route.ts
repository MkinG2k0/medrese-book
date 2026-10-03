import { serverError, success } from '@/shared/api'
import { prisma } from '@/shared/lib/prisma'
import { deliverNotifications } from '@/shared/lib/notifications/deliver-notifications'
import { verifyCronSecret } from '@/shared/lib/verify-cron-secret'

import { sendTuitionReminders } from '@/features/parent-portal/lib/send-tuition-reminders'

export async function GET(request: Request) {
	const authError = verifyCronSecret(request)
	if (authError) return authError

	try {
		const result = await prisma.$transaction((tx) => sendTuitionReminders(new Date(), tx))
		void deliverNotifications(result.notifications)

		return success({
			month: result.month,
			lastDay: result.lastDay,
			eligible: result.eligibleParentIds.length,
			created: result.created,
			skippedExisting: result.skippedExisting,
		})
	} catch (err) {
		return serverError(err)
	}
}
