import { StudentPaymentsPage } from '@/features/accounting'
import { getAccountingMonth } from '@/shared/lib/accounting/month'
import { requireRole } from '@/shared/lib/session'

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AccountingPaymentsPage({ searchParams }: PageProps) {
	await requireRole('ACCOUNTANT')
	const params = await searchParams
	const month = getAccountingMonth(new URLSearchParams(
		Object.entries(params).flatMap(([key, value]) =>
			value == null ? [] : [[key, String(value)]],
		),
	))
	return <StudentPaymentsPage month={month} />
}
