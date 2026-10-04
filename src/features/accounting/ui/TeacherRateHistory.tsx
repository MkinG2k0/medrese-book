'use client'

import { Table, Tag } from 'antd'

import type { TeacherRateHistoryItem } from '@/features/accounting/lib/teacher-rate-history'
import { formatMoney } from '@/shared/lib/money'
import { formatDate } from '@/shared/lib/utils'
import Text from '@/shared/ui/Text'

type TeacherRateHistoryProps = {
	current: TeacherRateHistoryItem | null
	history: TeacherRateHistoryItem[]
}

export function TeacherRateHistory({ current, history }: TeacherRateHistoryProps) {
	return (
		<div className="flex flex-col gap-3">
			<div>
				<Text type="secondary">Текущая ставка</Text>
				<div>
					<Text strong>
						{current
							? `${formatMoney(current.hourlyRateKopecks)} с ${formatDate(current.validFrom)}`
							: 'не задана'}
					</Text>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Text strong>История ставок</Text>
				<Table
					rowKey="id"
					size="small"
					pagination={false}
					locale={{ emptyText: 'Ставок ещё нет' }}
					dataSource={history}
					columns={[
						{
							title: 'Дата',
							dataIndex: 'validFrom',
							key: 'validFrom',
							render: (value: string) => formatDate(value),
						},
						{
							title: 'Ставка',
							dataIndex: 'hourlyRateKopecks',
							key: 'hourlyRateKopecks',
							render: (value: number) => formatMoney(value),
						},
						{
							title: '',
							key: 'current',
							width: 110,
							render: (_, row) =>
								row.isCurrent ? <Tag color="green">текущая</Tag> : null,
						},
					]}
				/>
			</div>
		</div>
	)
}
