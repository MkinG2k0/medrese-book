import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { success, error, serverError } from '@/shared/api'
import { adjustSessionDurationSchema } from '@/shared/lib/validations/accounting'

import { adjustTeachingSessionDuration } from '@/features/accounting/lib/accounting-mutations'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const { id } = await context.params
		const body = await request.json()
		const parsed = adjustSessionDurationSchema.safeParse(body)
		if (!parsed.success) return error(parsed.error.message)

		const adjustment = await adjustTeachingSessionDuration({
			teachingSessionId: id,
			adjustedMinutes: parsed.data.adjustedMinutes,
			reason: parsed.data.reason,
			actorId: auth.session.user.id,
		})
		return success(adjustment)
	} catch (err) {
		if (err instanceof Error) return error(err.message)
		return serverError(err)
	}
}
