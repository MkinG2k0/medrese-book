'use client'

import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Input, Select, Table } from 'antd'
import { useSession } from 'next-auth/react'
import { useMemo, useState } from 'react'

import {
	useCreateExtraAssignment,
	useDeleteExtraAssignment,
	useExtraAssignments,
	useUpdateExtraAssignment,
	type ExtraAssignmentTemplate,
} from '@/entities/extra-assignment'
import { ExtraAssignmentFormModal } from '@/features/extra-assignments/ui/ExtraAssignmentFormModal'
import type { ProgramLevelWithSteps } from '@/features/extra-assignments/ui/ExtraAssignmentFormModal'
import { formatDate } from '@/shared/lib/utils'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type ExtraAssignmentCatalogPageProps = {
	programLevels: ProgramLevelWithSteps[]
}

export function ExtraAssignmentCatalogPage({
	programLevels,
}: ExtraAssignmentCatalogPageProps) {
	const { data: session } = useSession()
	const { modal, message } = App.useApp()

	const [levelFilter, setLevelFilter] = useState<string | undefined>()
	const [stepFilter, setStepFilter] = useState<string | undefined>()
	const [titleFilter, setTitleFilter] = useState('')
	const [authorFilter, setAuthorFilter] = useState<string | undefined>()

	const [modalOpen, setModalOpen] = useState(false)
	const [editing, setEditing] = useState<ExtraAssignmentTemplate | null>(null)

	const filters = useMemo(
		() => ({
			levelId: levelFilter,
			stepId: stepFilter,
			title: titleFilter.trim() || undefined,
			authorId: authorFilter,
		}),
		[levelFilter, stepFilter, titleFilter, authorFilter],
	)

	const { data: assignments = [], isLoading } = useExtraAssignments(filters)
	const createMutation = useCreateExtraAssignment()
	const updateMutation = useUpdateExtraAssignment()
	const deleteMutation = useDeleteExtraAssignment()

	const stepOptions = useMemo(() => {
		const levels = levelFilter
			? programLevels.filter((level) => level.id === levelFilter)
			: programLevels
		return levels.flatMap((level) =>
			level.steps.map((step) => ({
				value: step.id,
				label: `Ур. ${level.number}, шаг ${step.order}: ${step.title}`,
			})),
		)
	}, [programLevels, levelFilter])

	const authorOptions = useMemo(() => {
		const authors = new Map<string, string>()
		for (const assignment of assignments) {
			authors.set(assignment.author.id, assignment.author.name)
		}
		return [...authors.entries()].map(([id, name]) => ({ value: id, label: name }))
	}, [assignments])

	const levelOptions = programLevels.map((level) => ({
		value: level.id,
		label: `Уровень ${level.number}: ${level.title}`,
	}))

	const currentUserId = session?.user?.id

	const handleCreate = () => {
		setEditing(null)
		setModalOpen(true)
	}

	const handleEdit = (assignment: ExtraAssignmentTemplate) => {
		setEditing(assignment)
		setModalOpen(true)
	}

	const handleSave = async (values: {
		title: string
		stepId: string | null
		content: ExtraAssignmentTemplate['content']
	}) => {
		try {
			if (editing) {
				await updateMutation.mutateAsync({ id: editing.id, ...values })
				message.success('Задание обновлено')
			} else {
				await createMutation.mutateAsync(values)
				message.success('Задание создано')
			}
			setModalOpen(false)
			setEditing(null)
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка сохранения')
		}
	}

	const handleDelete = (assignment: ExtraAssignmentTemplate) => {
		modal.confirm({
			title: 'Удалить задание?',
			content: assignment.title,
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				try {
					await deleteMutation.mutateAsync(assignment.id)
					message.success('Задание удалено')
					setModalOpen(false)
					setEditing(null)
				} catch (err) {
					message.error(err instanceof Error ? err.message : 'Ошибка удаления')
				}
			},
		})
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Title level={3}>Доп. задания</Title>
				<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
					Создать задание
				</Button>
			</div>

			<div className="flex flex-wrap gap-3">
				<Select
					allowClear
					placeholder="Уровень"
					className="min-w-[180px]"
					options={levelOptions}
					value={levelFilter}
					onChange={(value) => {
						setLevelFilter(value)
						setStepFilter(undefined)
					}}
				/>
				<Select
					allowClear
					placeholder="Шаг"
					className="min-w-[220px]"
					options={stepOptions}
					value={stepFilter}
					onChange={setStepFilter}
				/>
				<Input
					allowClear
					placeholder="Поиск по названию"
					className="min-w-[200px]"
					value={titleFilter}
					onChange={(e) => setTitleFilter(e.target.value)}
				/>
				<Select
					allowClear
					placeholder="Автор"
					className="min-w-[180px]"
					options={authorOptions}
					value={authorFilter}
					onChange={setAuthorFilter}
				/>
			</div>

			<Table<ExtraAssignmentTemplate>
				rowKey="id"
				loading={isLoading}
				dataSource={assignments}
				locale={{ emptyText: 'Нет доп. заданий' }}
				columns={[
					{
						title: 'Название',
						dataIndex: 'title',
						key: 'title',
						render: (title: string, record) => (
							<div className="flex flex-col gap-1">
								<Text strong>{title}</Text>
								{record.isSystem ? (
									<Text type="secondary">Системное</Text>
								) : null}
							</div>
						),
					},
					{
						title: 'Автор',
						key: 'author',
						render: (_, record) => record.author.name,
					},
					{
						title: 'Шаг',
						key: 'step',
						render: (_, record) =>
							record.step
								? `Шаг ${record.step.order}: ${record.step.title}`
								: '—',
					},
					{
						title: 'Уровень',
						key: 'level',
						render: (_, record) =>
							record.step
								? `Ур. ${record.step.level.number}: ${record.step.level.title}`
								: '—',
					},
					{
						title: 'Создано',
						dataIndex: 'createdAt',
						key: 'createdAt',
						render: (value: string) => formatDate(value),
					},
					{
						title: 'Действия',
						key: 'actions',
						render: (_, record) => (
							<div className="flex gap-2">
								<Button type="link" onClick={() => handleEdit(record)}>
									Изменить
								</Button>
								{record.authorId === currentUserId ? (
									<Button
										type="link"
										danger
										onClick={() => handleDelete(record)}
									>
										Удалить
									</Button>
								) : null}
							</div>
						),
					},
				]}
			/>

			<ExtraAssignmentFormModal
				open={modalOpen}
				assignment={editing}
				programLevels={programLevels}
				currentUserId={currentUserId}
				loading={createMutation.isPending || updateMutation.isPending}
				onCancel={() => {
					setModalOpen(false)
					setEditing(null)
				}}
				onSave={handleSave}
				onDelete={editing ? () => handleDelete(editing) : undefined}
			/>
		</div>
	)
}
