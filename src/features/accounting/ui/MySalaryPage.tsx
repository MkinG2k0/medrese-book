'use client'

import { Card, Statistic } from 'antd'

import { useMySalary } from '@/entities/accounting'
import { getSalaryStatusLabel } from '@/features/accounting/lib/accounting-labels'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

type MySalaryPageProps = {
	month: string
}

export function MySalaryPage({ month }: MySalaryPageProps) {
	const { data, isLoading } = useMySalary(month)
	const hours = Math.floor((data?.totalMinutes ?? 0) / 60)
	const minutes = (data?.totalMinutes ?? 0) % 60

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3}>Моя зарплата</Title>
				<AccountingMonthPicker month={month} />
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card loading={isLoading}>
					<Statistic
						title="Часы"
						value={`${hours} ч ${minutes} мин`}
					/>
				</Card>
				<Card loading={isLoading}>
					<Statistic
						title="Начислено"
						value={formatMoney(data?.amountKopecks ?? 0)}
					/>
				</Card>
				<Card loading={isLoading}>
					<Statistic
						title="Выплачено"
						value={formatMoney(data?.paidKopecks ?? 0)}
					/>
				</Card>
				<Card loading={isLoading}>
					<Statistic
						title="Статус"
						value={getSalaryStatusLabel(data?.status ?? 'DRAFT')}
					/>
				</Card>
			</div>
		</div>
	)
}
