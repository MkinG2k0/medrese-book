import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import { toSessionDate } from '@/shared/lib/calendar-date'
import { error, serverError } from '@/shared/api'
import { exportQuerySchema } from '@/shared/lib/validations/accounting'

import {
	buildLedgerWorkbook,
	buildPaymentsWorkbook,
	buildSalariesWorkbook,
} from '@/features/accounting/lib/export-excel'
import { queryOperationsLedger } from '@/features/accounting/lib/query-operations-ledger'
import { querySalariesForMonth } from '@/features/accounting/lib/query-salaries'
import { queryStudentPaymentsForMonth } from '@/features/accounting/lib/query-student-payments'

type RouteContext = { params: Promise<{ type: string }> }

export async function GET(request: Request, context: RouteContext) {
	const auth = await authorizeApiRequest({ allowedRoles: ['ACCOUNTANT'] })
	if ('error' in auth) return auth.error

	try {
		const { type } = await context.params
		const url = new URL(request.url)
		const parsed = exportQuerySchema.safeParse({
			from: url.searchParams.get('from'),
			to: url.searchParams.get('to'),
			type,
		})
		if (!parsed.success) return error(parsed.error.message)

		const fromDate = toSessionDate(parsed.data.from)
		const toDate = toSessionDate(parsed.data.to)
		toDate.setHours(23, 59, 59, 999)

		let buffer: Buffer
		let filename: string

		if (parsed.data.type === 'payments') {
			const month = parsed.data.from.slice(0, 7)
			const rows = await queryStudentPaymentsForMonth(month)
			buffer = await buildPaymentsWorkbook(rows)
			filename = `payments-${month}.xlsx`
		} else if (parsed.data.type === 'salaries') {
			const month = parsed.data.from.slice(0, 7)
			const rows = await querySalariesForMonth(month)
			buffer = await buildSalariesWorkbook(rows)
			filename = `salaries-${month}.xlsx`
		} else {
			const entries = await queryOperationsLedger({ from: fromDate, to: toDate })
			buffer = await buildLedgerWorkbook(entries)
			filename = `ledger-${parsed.data.from}-${parsed.data.to}.xlsx`
		}

		return new Response(new Uint8Array(buffer), {
			headers: {
				'Content-Type':
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${filename}"`,
			},
		})
	} catch (err) {
		return serverError(err)
	}
}
