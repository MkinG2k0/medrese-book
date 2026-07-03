'use client'

import { App, Button, Card, Col, Row, Statistic } from 'antd'
import { useQueryClient } from '@tanstack/react-query'

import { useAccountingDashboard } from '@/entities/accounting'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import { formatMoney } from '@/shared/lib/money'
import Title from '@/shared/ui/Title'

type AccountingDashboardPageProps = {
	month: string
}

export function AccountingDashboardPage({ month }: AccountingDashboardPageProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const { data, isLoading } = useAccountingDashboard(month)

	const runAction = async (label: string, url: string, body?: object) => {
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: body ? JSON.stringify(body) : undefined,
			})
			const json = await res.json()
			if (json.error) throw new Error(json.error)
			message.success(label)
			await queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] })
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка')
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3}>Бухгалтерия</Title>
				<div className="flex flex-wrap items-center gap-3">
					<AccountingMonthPicker month={month} />
					<Button
						onClick={() =>
							void runAction(
								'Начисления созданы',
								'/api/accounting/charges/generate',
								{ month },
							)
						}
					>
						Начислить за месяц
					</Button>
					<Button
						danger
						onClick={() =>
							void runAction(
								'Месяц закрыт',
								'/api/accounting/month-close',
								{ month },
							)
						}
					>
						Закрыть месяц
					</Button>
				</div>
			</div>

			<Row gutter={[16, 16]}>
				<Col xs={24} md={12} xl={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Баланс школы"
							value={formatMoney(data?.balanceKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={12} xl={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Обязательства (ЗП)"
							value={formatMoney(data?.obligationsKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={12} xl={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Поступило за месяц"
							value={formatMoney(data?.monthIncomeKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={12} xl={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Начислено за месяц"
							value={formatMoney(data?.monthChargedKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={12} xl={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Сумма долгов"
							value={formatMoney(data?.totalDebtKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={12} xl={8}>
					<Card loading={isLoading}>
						<Statistic title="Должников" value={data?.debtorCount ?? 0} />
					</Card>
				</Col>
				<Col xs={24} md={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Наличные"
							value={formatMoney(data?.cashBalanceKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Карта"
							value={formatMoney(data?.cardBalanceKopecks ?? 0)}
						/>
					</Card>
				</Col>
				<Col xs={24} md={8}>
					<Card loading={isLoading}>
						<Statistic
							title="Перевод"
							value={formatMoney(data?.transferBalanceKopecks ?? 0)}
						/>
					</Card>
				</Col>
			</Row>
		</div>
	)
}
