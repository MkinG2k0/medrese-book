'use client'

import { Card, Statistic } from 'antd'

import { useMySalary } from '@/entities/accounting'
import { getSalaryStatusLabel } from '@/features/accounting/lib/accounting-labels'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import type { TeacherLessonAnalyticsRow } from '@/features/analytics/lib/teacher-lessons-analytics'
import { TeacherLessonsTable } from '@/features/analytics/ui/TeacherLessonsAnalytics'
import { TeacherLessonsDateFilter } from '@/features/analytics/ui/TeacherLessonsDateFilter'
import { formatMoney } from '@/shared/lib/money'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type MySalaryPageProps = {
	month: string
	hoursRows: TeacherLessonAnalyticsRow[]
	hoursFrom: string
	hoursTo: string
	hoursIsRange: boolean
}

export function MySalaryPage({
	month,
	hoursRows,
	hoursFrom,
	hoursTo,
	hoursIsRange,
}: MySalaryPageProps) {
	const { data, isLoading } = useMySalary(month)
	const hours = Math.floor((data?.totalMinutes ?? 0) / 60)
	const minutes = (data?.totalMinutes ?? 0) % 60

	const hoursPeriodLabel = hoursIsRange
		? `с ${hoursFrom} по ${hoursTo} (средние значения)`
		: hoursFrom

	return (
		<div className="flex flex-col gap-8">
			<section className="flex flex-col gap-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Title level={3} className="!mb-0">
						Моя зарплата
					</Title>
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
			</section>

			<section className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<Title level={4} className="!mb-1">
							Мои часы
						</Title>
						<Text type="secondary">Период: {hoursPeriodLabel}</Text>
					</div>
					<TeacherLessonsDateFilter from={hoursFrom} to={hoursTo} />
				</div>

				<TeacherLessonsTable
					rows={hoursRows}
					isRange={hoursIsRange}
					showTeacherColumn={false}
				/>
			</section>
		</div>
	)
}
