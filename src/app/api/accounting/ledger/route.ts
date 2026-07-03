import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { toSessionDate } from '@/shared/lib/calendar-date'
import { success, error, serverError } from '@/shared/api'

import { queryOperationsLedger } from '@/features/accounting/lib/query-operations-ledger'

export async function GET(request: Request) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const url = new URL(request.url)
		const from = url.searchParams.get('from')
		const to = url.searchParams.get('to')
		const type = url.searchParams.get('type') ?? undefined

		const fromDate = from ? toSessionDate(from) : undefined
		const toDate = to ? toSessionDate(to) : undefined
		if (toDate) toDate.setHours(23, 59, 59, 999)

		const data = await queryOperationsLedger({
			from: fromDate,
			to: toDate,
			type: type as never,
		})
		return success(data)
	} catch (err) {
		return serverError(err)
	}
}
