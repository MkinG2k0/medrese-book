import { getParentPaymentPageData } from '@/features/parent-portal/actions/parent-payment-actions'
import { ParentPayForm } from '@/features/parent-portal/ui/ParentPayForm'
import { requireRole } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

export default async function ParentPayPage() {
	await requireRole('PARENT')
	const data = await getParentPaymentPageData()

	return (
		<div className="flex max-w-3xl flex-col gap-6">
			<div className="flex flex-col gap-1">
				<Title level={3}>Оплата</Title>
				<Text type="secondary">
					Выберите детей и суммы, затем нажмите «Оплатить». Заявка уйдёт
					бухгалтеру на подтверждение.
				</Text>
			</div>

			<ParentPayForm
				parentUserId={data.parentUserId}
				paymentChildren={data.children}
				requests={data.requests}
			/>
		</div>
	)
}
