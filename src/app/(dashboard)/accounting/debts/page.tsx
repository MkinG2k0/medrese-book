import { queryTuitionDebts } from '@/features/accounting/lib/query-tuition-debts'
import { TuitionDebtsPage } from '@/features/accounting/ui/TuitionDebtsPage'
import { requireRoles } from '@/shared/lib/session'

export default async function AccountingDebtsPage() {
	await requireRoles(['ACCOUNTANT', 'CASHIER'])
	const rows = await queryTuitionDebts()
	return <TuitionDebtsPage rows={rows} />
}
