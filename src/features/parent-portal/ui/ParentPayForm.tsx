'use client'

import { Button, Checkbox } from 'antd'

import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import type {
	ParentPaymentChild,
	ParentPaymentRequestSummary,
} from '@/features/parent-portal/actions/parent-payment-actions'
import { useParentPayForm } from '@/features/parent-portal/lib'
import { formatMoney } from '@/shared/lib/money'
import Text from '@/shared/ui/Text'

import { ParentMonthSelect } from './ParentMonthSelect'
import { ParentPayRequestsList } from './ParentPayRequestsList'

interface ParentPayFormProps {
	parentUserId: string
	paymentChildren: ParentPaymentChild[]
	requests: ParentPaymentRequestSummary[]
	className?: string
}

export function ParentPayForm({
	parentUserId,
	paymentChildren,
	requests,
	className,
}: ParentPayFormProps) {
	const {
		amounts,
		handleSubmit,
		isPending,
		month,
		monthOptions,
		requests: requestList,
		selectedIds,
		setAmounts,
		setMonth,
		toggleChild,
		totalKopecks,
	} = useParentPayForm({ parentUserId, paymentChildren, requests })

	if (paymentChildren.length === 0) {
		return (
			<Text type="secondary">
				Нет активных детей для оплаты. Обратитесь к менеджеру.
			</Text>
		)
	}

	return (
		<div className={className ?? 'flex flex-col gap-6'}>
			<div className="flex flex-col gap-2 sm:max-w-xs">
				<Text>Месяц оплаты</Text>
				<ParentMonthSelect
					value={month}
					options={monthOptions}
					onChange={setMonth}
				/>
			</div>

			<div className="flex flex-col gap-3">
				{paymentChildren.map((child) => {
					const checked = selectedIds.includes(child.studentId)
					return (
						<div
							key={child.studentId}
							className="flex flex-col gap-3 rounded-lg border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="flex items-start gap-3">
								<Checkbox
									checked={checked}
									onChange={(event) =>
										toggleChild(child.studentId, event.target.checked)
									}
								/>
								<div className="flex flex-col gap-1">
									<Text strong>{child.name}</Text>
									<Text type="secondary">
										{child.groupNames.length > 0
											? child.groupNames.join(', ')
											: 'Без группы'}
										{' · '}
										тариф {formatMoney(child.tuitionRateKopecks)}
									</Text>
								</div>
							</div>
							<div className="w-full sm:w-44">
								<MoneyInput
									valueKopecks={amounts[child.studentId] ?? null}
									onChangeKopecks={(value) =>
										setAmounts((prev) => ({
											...prev,
											[child.studentId]: value,
										}))
									}
									placeholder={String(child.tuitionRateKopecks / 100)}
								/>
							</div>
						</div>
					)
				})}
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Text>
					Итого: <Text strong>{formatMoney(totalKopecks)}</Text>
					{' · '}
					выбрано {selectedIds.length} из {paymentChildren.length}
				</Text>
				<Button
					type="primary"
					size="large"
					loading={isPending}
					disabled={totalKopecks <= 0 || !month}
					onClick={handleSubmit}
				>
					Оплатить
				</Button>
			</div>

			<ParentPayRequestsList requests={requestList} />
		</div>
	)
}
