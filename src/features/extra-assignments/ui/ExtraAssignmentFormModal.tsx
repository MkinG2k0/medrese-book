'use client'

import { Button, Form, Input, Modal, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import type { ExtraAssignmentTemplate } from '@/entities/extra-assignment'
import { StepEditor } from '@/features/program-admin/ui/editor/StepEditor'
import type { StepContent } from '@/shared/lib/validations/step'

export type ProgramLevelWithSteps = {
	id: string
	number: number
	title: string
	steps: { id: string; order: number; title: string; levelId: string }[]
}

type ExtraAssignmentFormModalProps = {
	open: boolean
	assignment: ExtraAssignmentTemplate | null
	programLevels: ProgramLevelWithSteps[]
	currentUserId?: string
	loading?: boolean
	onCancel: () => void
	onSave: (values: {
		title: string
		stepId: string | null
		content: StepContent
	}) => void | Promise<void>
	onDelete?: () => void
}

export function ExtraAssignmentFormModal({
	open,
	assignment,
	programLevels,
	currentUserId,
	loading,
	onCancel,
	onSave,
	onDelete,
}: ExtraAssignmentFormModalProps) {
	const [title, setTitle] = useState('')
	const [stepId, setStepId] = useState<string | null>(null)
	const [levelId, setLevelId] = useState<string | undefined>()
	const [content, setContent] = useState<StepContent>({
		blocks: [{ type: 'text', value: '' }],
	})

	useEffect(() => {
		if (!open) return
		if (assignment) {
			setTitle(assignment.title)
			setStepId(assignment.stepId)
			setLevelId(assignment.step?.levelId)
			setContent(assignment.content)
		} else {
			setTitle('')
			setStepId(null)
			setLevelId(undefined)
			setContent({ blocks: [{ type: 'text', value: '' }] })
		}
	}, [open, assignment])

	const levelOptions = programLevels.map((level) => ({
		value: level.id,
		label: `Уровень ${level.number}: ${level.title}`,
	}))

	const stepOptions = useMemo(() => {
		const levels = levelId
			? programLevels.filter((level) => level.id === levelId)
			: programLevels
		return levels.flatMap((level) =>
			level.steps.map((step) => ({
				value: step.id,
				label: `Шаг ${step.order}: ${step.title}`,
			})),
		)
	}, [programLevels, levelId])

	const canDelete =
		assignment && currentUserId && assignment.authorId === currentUserId

	return (
		<Modal
			title={assignment ? 'Редактировать задание' : 'Создать задание'}
			open={open}
			onCancel={onCancel}
			footer={
				<div className="flex justify-between gap-2">
					<div>
						{canDelete && onDelete ? (
							<Button danger onClick={onDelete}>
								Удалить
							</Button>
						) : null}
					</div>
					<div className="flex gap-2">
						<Button onClick={onCancel}>Отмена</Button>
						<Button
							type="primary"
							loading={loading}
							onClick={() => void onSave({ title, stepId, content })}
							disabled={!title.trim()}
						>
							Сохранить
						</Button>
					</div>
				</div>
			}
			width={720}
			destroyOnHidden
		>
			<Form layout="vertical">
				<Form.Item label="Название" required>
					<Input value={title} onChange={(e) => setTitle(e.target.value)} />
				</Form.Item>
				<div className="flex flex-wrap gap-4">
					<Form.Item label="Уровень" className="min-w-[200px] flex-1">
						<Select
							allowClear
							placeholder="Любой"
							options={levelOptions}
							value={levelId}
							onChange={(value) => {
								setLevelId(value)
								setStepId(null)
							}}
						/>
					</Form.Item>
					<Form.Item label="Шаг программы" className="min-w-[200px] flex-1">
						<Select
							allowClear
							placeholder="Не привязан"
							options={stepOptions}
							value={stepId ?? undefined}
							onChange={(value) => setStepId(value ?? null)}
						/>
					</Form.Item>
				</div>
				<Form.Item label="Содержание">
					<StepEditor
						key={assignment?.id ?? 'new'}
						initialContent={assignment?.content}
						onChange={setContent}
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
