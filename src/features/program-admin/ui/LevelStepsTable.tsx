'use client'

import { Button, Table } from 'antd'
import Link from 'next/link'

import { programStepEditPath } from '@/features/program-admin/lib/program-paths'
import Text from '@/shared/ui/Text'

type StepRow = {
	id: string
	order: number
	globalNumber: number
	title: string
	hours: number
}

export function LevelStepsTable({
	subjectId,
	levelId,
	steps,
}: {
	subjectId: string
	levelId: string
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
					render: (order: number, record) => (
						<>
							{order}{' '}
							<Text type="secondary">({record.globalNumber})</Text>
						</>
					),
				},
				{ title: 'Название', dataIndex: 'title', key: 'title' },
				{ title: 'Часы', dataIndex: 'hours', key: 'hours' },
				{
					title: 'Действия',
					key: 'actions',
					render: (_, record) => (
						<Link
							href={programStepEditPath(subjectId, levelId, record.id)}
						>
							<Button size="small">Редактировать</Button>
						</Link>
					),
				},
			]}
		/>
	)
}
