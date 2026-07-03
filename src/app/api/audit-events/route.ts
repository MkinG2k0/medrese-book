import { ZodError } from 'zod'

import {
	queryAuditEvents,
} from '@/features/audit-log/lib/query-audit-events'
import { error, serverError, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { parseAuditEventQuery } from '@/shared/lib/validations/audit-event'

export async function GET(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	try {
		const filters = parseAuditEventQuery(new URL(request.url).searchParams)
		const data = await queryAuditEvents(filters)
		return success(data)
	} catch (err) {
		if (err instanceof ZodError) {
			return error(err.issues[0]?.message ?? 'Некорректные параметры запроса')
		}
		return serverError(err)
	}
}
