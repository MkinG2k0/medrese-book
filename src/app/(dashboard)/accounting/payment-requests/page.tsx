import { listPendingTuitionPaymentRequests } from '@/features/accounting/actions/payment-request-actions'
import { PaymentRequestsPage } from '@/features/accounting/ui/PaymentRequestsPage'
import { requireRole } from '@/shared/lib/session'

export default async function AccountingPaymentRequestsPage() {
	await requireRole('ACCOUNTANT')
	const requests = await listPendingTuitionPaymentRequests()
	return <PaymentRequestsPage requests={requests} />
}
