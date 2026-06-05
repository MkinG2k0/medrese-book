'use client'

import { Button, Table } from 'antd'
import Link from 'next/link'

type StepRow = {
	id: string
	order: number
	type: string
	title: string
	hours: number
}

export function LevelStepsTable({
	levelId,
	steps,
}: {
	levelId: string
	steps: StepRow[]
}) {
	return (
		<Table
			dataSource={steps}
			rowKey="id"
			columns={[
				{ title: '№', dataIndex: 'order', key: 'order' },
				{ title: 'Тип', dataIndex: 'type', key: 'type' },
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
