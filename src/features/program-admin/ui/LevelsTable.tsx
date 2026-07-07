'use client'

import { App, Button, Table } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { deleteLevel } from '@/features/program-admin/actions/program-actions'
import { programLevelPath } from '@/features/program-admin/lib/program-paths'

type LevelRow = {
	id: string
	number: number
	title: string
	_count: { steps: number }
}

export function LevelsTable({
	subjectId,
	levels,
}: {
	subjectId: string
	levels: LevelRow[]
}) {
	const { modal, message } = App.useApp()
	const router = useRouter()

	const handleDelete = (record: LevelRow) => {
		modal.confirm({
			title: 'Удалить уровень?',
			content: `Уровень «${record.title}» будет удалён безвозвратно.`,
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				try {
					await deleteLevel(subjectId, record.id)
					message.success('Уровень удалён')
					router.refresh()
				} catch (err) {
					message.error(
						err instanceof Error
							? err.message
							: 'Не удалось удалить уровень',
					)
				}
			},
		})
	}

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
						<div className="flex gap-2">
							<Link href={programLevelPath(subjectId, record.id)}>
								<Button size="small">Редактировать</Button>
							</Link>
							<Button
								size="small"
								danger
								onClick={() => handleDelete(record)}
							>
								Удалить
							</Button>
						</div>
					),
				},
			]}
		/>
	)
}
