import { OperationsLedgerPage } from '@/features/accounting'
import { requireRole } from '@/shared/lib/session'

export default async function AccountingLedgerPage() {
	await requireRole('ACCOUNTANT')
	return <OperationsLedgerPage />
}
