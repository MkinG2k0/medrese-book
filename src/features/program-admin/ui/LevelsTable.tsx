'use client'

import { Button, Table } from 'antd'
import Link from 'next/link'

type LevelRow = {
	id: string
	number: number
	title: string
	_count: { steps: number }
}

export function LevelsTable({ levels }: { levels: LevelRow[] }) {
	return (
		<Table
			dataSource={levels}
			rowKey="id"
			columns={[
				{ title: 'Уровень', dataIndex: 'number', key: 'number' },
				{ title: 'Название', dataIndex: 'title', key: 'title' },
				{
					title: 'Шагов',
					key: 'steps',
					render: (_, record) => record._count.steps,
				},
				{
					title: 'Действия',
					key: 'actions',
					render: (_, record) => (
						<Link href={`/admin/program/${record.id}`}>
							<Button size="small">Открыть</Button>
						</Link>
					),
				},
			]}
		/>
	)
}
