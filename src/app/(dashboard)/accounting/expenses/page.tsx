import { ExpensesPage } from '@/features/accounting'
import { requireRole } from '@/shared/lib/session'

export default async function AccountingExpensesPage() {
	await requireRole('ACCOUNTANT')
	return <ExpensesPage />
}
