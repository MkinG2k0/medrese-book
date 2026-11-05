import { listPendingTuitionPaymentRequests } from '@/features/accounting/actions/payment-request-actions'
import { PaymentRequestsPage } from '@/features/accounting/ui/PaymentRequestsPage'
import { requireRoles } from '@/shared/lib/session'

export default async function AccountingPaymentRequestsPage() {
	await requireRoles(['ACCOUNTANT', 'CASHIER'])
	const requests = await listPendingTuitionPaymentRequests()
	return <PaymentRequestsPage requests={requests} />
}
