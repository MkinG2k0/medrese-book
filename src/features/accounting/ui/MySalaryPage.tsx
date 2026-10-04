'use client'

import { Card, Statistic } from 'antd'

import { useMySalary } from '@/entities/accounting'
import type { TeacherRateView } from '@/features/accounting/actions/teacher-rate-actions'
import { getSalaryStatusLabel } from '@/features/accounting/lib/accounting-labels'
import { AccountingMonthPicker } from '@/features/accounting/ui/AccountingMonthPicker'
import { TeacherRateHistory } from '@/features/accounting/ui/TeacherRateHistory'
import type { TeacherLessonAnalyticsRow } from '@/features/analytics/lib/teacher-lessons-analytics'
import {
	TeacherLessonsGroupPicker,
	TeacherLessonsTable,
} from '@/features/analytics/ui/TeacherLessonsAnalytics'
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
	hoursGroups: { id: string; name: string }[]
	selectedGroupId: string | null
	rateView: TeacherRateView | null
}

export function MySalaryPage({
	month,
	hoursRows,
	hoursFrom,
	hoursTo,
	hoursIsRange,
	hoursGroups,
	selectedGroupId,
	rateView,
}: MySalaryPageProps) {
	const { data, isLoading } = useMySalary(month)
	const hours = Math.floor((data?.totalMinutes ?? 0) / 60)
	const minutes = (data?.totalMinutes ?? 0) % 60
	const dayTotalKopecks = hoursRows.reduce(
		(sum, row) => sum + row.earnedKopecks,
		0,
	)

	const hoursPeriodLabel = hoursIsRange
		? `с ${hoursFrom} по ${hoursTo} (средние значения)`
		: hoursFrom

	return (
		<div className="flex w-full min-w-0 flex-col gap-8">
			<section className="flex flex-col gap-6">
				<div className="flex min-w-0 items-center justify-between gap-4">
					<Title level={3} className="!mb-0 shrink-0 whitespace-nowrap">
						Моя зарплата
					</Title>
					<div className="min-w-0 max-w-xs flex-1">
						<AccountingMonthPicker month={month} />
					</div>
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
				<Title level={4} className="!mb-0">
					Ставка
				</Title>
				<TeacherRateHistory
					current={rateView?.current ?? null}
					history={rateView?.history ?? []}
				/>
			</section>

			<section className="flex flex-col gap-4">
				<div className="flex min-w-0 flex-col gap-4">
					<div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
						<div className="min-w-0">
							<Title level={4} className="!mb-1">
								Мои часы
							</Title>
							<Text type="secondary">Период: {hoursPeriodLabel}</Text>
						</div>
						<Text strong>
							{hoursIsRange ? 'В среднем за день: ' : 'Всего за день: '}
							{formatMoney(dayTotalKopecks)}
						</Text>
					</div>
					<div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
						<TeacherLessonsGroupPicker
							groups={hoursGroups}
							selectedGroupId={selectedGroupId}
							from={hoursFrom}
							to={hoursTo}
						/>
						<TeacherLessonsDateFilter
							from={hoursFrom}
							to={hoursTo}
							selectedGroupId={selectedGroupId}
						/>
					</div>
				</div>

				<TeacherLessonsTable
					rows={hoursRows}
					isRange={hoursIsRange}
					showTeacherColumn={false}
					alwaysExpanded
				/>
			</section>
		</div>
	)
}
