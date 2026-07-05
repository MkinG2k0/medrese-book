'use client'

import { App, Button, Input, Modal, Select, Table } from 'antd'
import { useMemo, useState } from 'react'

import {
	useAssignExtraAssignment,
	useExtraAssignments,
	type ExtraAssignmentTemplate,
} from '@/entities/extra-assignment'

type AssignExtraAssignmentModalProps = {
	open: boolean
	studentId: string
	sessionId: string | null
	displayStepId: string
	displayStepLabel?: string
	date: string
	onClose: () => void
	onAssigned: () => void
	onEnsureSession: () => Promise<string | null>
}

export function AssignExtraAssignmentModal({
	open,
	studentId,
	sessionId,
	displayStepId,
	displayStepLabel,
	date,
	onClose,
	onAssigned,
	onEnsureSession,
}: AssignExtraAssignmentModalProps) {
	const { message } = App.useApp()

	const [authorFilter, setAuthorFilter] = useState<string | undefined>()
	const [stepFilter, setStepFilter] = useState<string | undefined>()
	const [titleFilter, setTitleFilter] = useState('')

	const filters = useMemo(
		() => ({
			authorId: authorFilter,
			stepId: stepFilter,
			title: titleFilter.trim() || undefined,
		}),
		[authorFilter, stepFilter, titleFilter],
	)

	const { data: templates = [], isLoading } = useExtraAssignments(filters)
	const assignMutation = useAssignExtraAssignment(studentId, date)

	const authorOptions = useMemo(() => {
		const authors = new Map<string, string>()
		for (const template of templates) {
			authors.set(template.author.id, template.author.name)
		}
		return [...authors.entries()].map(([id, name]) => ({ value: id, label: name }))
	}, [templates])

	const stepOptions = useMemo(() => {
		const steps = new Map<string, string>()
		for (const template of templates) {
			if (template.step) {
				steps.set(
					template.step.id,
					`Шаг ${template.step.order}: ${template.step.title}`,
				)
			}
		}
		return [...steps.entries()].map(([id, label]) => ({ value: id, label }))
	}, [templates])

	const handleAssign = async (template: ExtraAssignmentTemplate) => {
		let resolvedSessionId = sessionId
		if (!resolvedSessionId) {
			resolvedSessionId = await onEnsureSession()
		}
		if (!resolvedSessionId) {
			message.error('Не удалось создать занятие для назначения')
			return
		}

		try {
			await assignMutation.mutateAsync({
				templateId: template.id,
				studentId,
				sessionId: resolvedSessionId,
				displayStepId,
			})
			message.success(`Назначено: ${template.title}`)
			onAssigned()
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Ошибка назначения')
		}
	}

	return (
		<Modal
			title="Дать доп. задание"
			open={open}
			onCancel={onClose}
			footer={null}
			width={720}
			destroyOnHidden
		>
			{displayStepLabel ? (
				<p className="mb-4 text-sm text-[var(--ant-color-text-secondary)]">
					Под шагом: {displayStepLabel}
				</p>
			) : null}

			<div className="mb-4 flex flex-wrap gap-3">
				<Select
					allowClear
					placeholder="Автор"
					className="min-w-[160px]"
					options={authorOptions}
					value={authorFilter}
					onChange={setAuthorFilter}
				/>
				<Select
					allowClear
					placeholder="Шаг шаблона"
					className="min-w-[180px]"
					options={stepOptions}
					value={stepFilter}
					onChange={setStepFilter}
				/>
				<Input
					allowClear
					placeholder="Название"
					className="min-w-[180px]"
					value={titleFilter}
					onChange={(e) => setTitleFilter(e.target.value)}
				/>
			</div>

			<Table<ExtraAssignmentTemplate>
				rowKey="id"
				loading={isLoading}
				dataSource={templates}
				pagination={{ pageSize: 8, showSizeChanger: false }}
				locale={{ emptyText: 'Нет заданий в справочнике' }}
				columns={[
					{
						title: 'Название',
						dataIndex: 'title',
						key: 'title',
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
						title: '',
						key: 'action',
						render: (_, record) => (
							<Button
								type="primary"
								size="small"
								loading={assignMutation.isPending}
								onClick={() => void handleAssign(record)}
							>
								Назначить
							</Button>
						),
					},
				]}
			/>
		</Modal>
	)
}
