'use client'

import { App, Button, Modal, Table, Tag } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { deleteSubject } from '@/features/subject-admin/actions/subject-actions'
import { CreateSubjectForm } from '@/features/subject-admin/ui/CreateSubjectForm'
import { EditSubjectForm } from '@/features/subject-admin/ui/EditSubjectForm'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

export type SubjectRow = {
	id: string
	name: string
	description: string
	levelCount: number
	stepCount: number
}

type SubjectsListProps = {
	subjects: SubjectRow[]
}

const BLOCKED_DELETE_MESSAGE =
	'Нельзя удалить предмет с программой. Сначала удалите все уровни.'

export function SubjectsList({ subjects }: SubjectsListProps) {
	const { modal, message } = App.useApp()
	const [showCreate, setShowCreate] = useState(false)
	const [editSubject, setEditSubject] = useState<SubjectRow | null>(null)
	const router = useRouter()

	const handleDelete = (record: SubjectRow) => {
		if (record.levelCount > 0) {
			message.error(BLOCKED_DELETE_MESSAGE)
			return
		}

		modal.confirm({
			title: 'Удалить предмет?',
			content: `Предмет «${record.name}» будет удалён безвозвратно.`,
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				try {
					await deleteSubject(record.id)
					message.success('Предмет удалён')
					router.refresh()
				} catch (err) {
					message.error(
						err instanceof Error
							? err.message
							: 'Не удалось сохранить. Попробуйте ещё раз.',
					)
				}
			},
		})
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Title level={3}>Предметы</Title>
				<Button type="primary" onClick={() => setShowCreate(true)}>
					Создать предмет
				</Button>
			</div>

			{subjects.length === 0 && (
				<Text type="secondary">
					Пока нет предметов. Создайте первый предмет, чтобы настроить программу
					обучения.
				</Text>
			)}

			<Table
				dataSource={subjects}
				rowKey="id"
				columns={[
					{
						title: 'Название',
						dataIndex: 'name',
						key: 'name',
						render: (name: string, record: SubjectRow) => (
							<Link href={`/admin/subjects/${record.id}/program`}>{name}</Link>
						),
					},
					{
						title: 'Описание',
						dataIndex: 'description',
						key: 'description',
						render: (description: string) =>
							description ? (
								description
							) : (
								<Text type="secondary">—</Text>
							),
					},
					{
						title: 'Уровней',
						dataIndex: 'levelCount',
						key: 'levelCount',
						render: (count: number) => <Tag>{count}</Tag>,
					},
					{
						title: 'Шагов',
						dataIndex: 'stepCount',
						key: 'stepCount',
						render: (count: number) =>
							count > 0 ? <Tag>{count}</Tag> : <Text type="secondary">—</Text>,
					},
					{
						title: 'Действия',
						key: 'actions',
						render: (_: unknown, record: SubjectRow) => (
							<div className="flex gap-2">
								<Button size="small" onClick={() => setEditSubject(record)}>
									Редактировать
								</Button>
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

			<Modal
				title="Создать предмет"
				open={showCreate}
				onCancel={() => setShowCreate(false)}
				footer={null}
				destroyOnHidden
			>
				<CreateSubjectForm
					onSuccess={() => {
						setShowCreate(false)
						router.refresh()
					}}
				/>
			</Modal>

			<Modal
				title="Редактировать предмет"
				open={editSubject !== null}
				onCancel={() => setEditSubject(null)}
				footer={null}
				destroyOnHidden
			>
				{editSubject && (
					<EditSubjectForm
						key={editSubject.id}
						subjectId={editSubject.id}
						initialName={editSubject.name}
						initialDescription={editSubject.description}
						onSuccess={() => {
							setEditSubject(null)
							router.refresh()
						}}
					/>
				)}
			</Modal>
		</div>
	)
}
