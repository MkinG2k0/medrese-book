'use client'

import { Button, Table } from 'antd'
import Link from 'next/link'

import Text from '@/shared/ui/Text'
import { toGlobalStepNumber } from '@/shared/lib/student-progress'

type StepRow = {
	id: string
	order: number
	title: string
	hours: number
}

export function LevelStepsTable({
	levelId,
	stepOffset,
	steps,
}: {
	levelId: string
	stepOffset: number
	steps: StepRow[]
}) {
	return (
		<Table
			dataSource={steps}
			rowKey="id"
			columns={[
				{
					title: '№',
					dataIndex: 'order',
					key: 'order',
					render: (order: number) => (
						<>
							{order}{' '}
							<Text type="secondary">
								({toGlobalStepNumber(stepOffset, order)})
							</Text>
						</>
					),
				},
				{ title: 'Название', dataIndex: 'title', key: 'title' },
				{ title: 'Часы', dataIndex: 'hours', key: 'hours' },
				{
					title: 'Действия',
					key: 'actions',
					render: (_, record) => (
						<Link href={`/admin/program/${levelId}/steps/${record.id}/edit`}>
							<Button size="small">Редактировать</Button>
						</Link>
					),
				},
			]}
		/>
	)
}
