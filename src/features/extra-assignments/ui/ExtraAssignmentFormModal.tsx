'use client'

import { Button, Form, Input, Modal, Select } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ExtraAssignmentTemplate } from '@/entities/extra-assignment'
import {
	clearExtraAssignmentDraft,
	readExtraAssignmentDraft,
	writeExtraAssignmentDraft,
} from '@/features/extra-assignments/lib/extra-assignment-draft'
import { StepEditor } from '@/features/program-admin/ui/editor/StepEditor'
import { useDebounce } from '@/shared/lib/use-debounce'
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
	subjectId: string
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

const EMPTY_CONTENT: StepContent = { blocks: [{ type: 'text', value: '' }] }

export function ExtraAssignmentFormModal({
	open,
	assignment,
	subjectId,
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
	const [content, setContent] = useState<StepContent>(EMPTY_CONTENT)
	const [editorKey, setEditorKey] = useState('new')
	const skipNextDraftWrite = useRef(false)

	const isCreate = !assignment

	useEffect(() => {
		if (!open) return

		if (assignment) {
			skipNextDraftWrite.current = true
			setTitle(assignment.title)
			setStepId(assignment.stepId)
			setLevelId(assignment.step?.levelId)
			setContent(assignment.content)
			setEditorKey(assignment.id)
			return
		}

		const draft =
			currentUserId && subjectId
				? readExtraAssignmentDraft(currentUserId, subjectId)
				: null

		skipNextDraftWrite.current = true
		if (draft) {
			setTitle(draft.title)
			setStepId(draft.stepId)
			setLevelId(draft.levelId)
			setContent(draft.content)
			setEditorKey(
				`draft-${subjectId}-${draft.title.length}-${draft.content.blocks.length}`,
			)
		} else {
			setTitle('')
			setStepId(null)
			setLevelId(undefined)
			setContent(EMPTY_CONTENT)
			setEditorKey(`new-${subjectId}`)
		}
	}, [open, assignment, currentUserId, subjectId])

	const draftSnapshot = useMemo(
		() => ({ title, levelId, stepId, content }),
		[title, levelId, stepId, content],
	)
	const debouncedDraft = useDebounce(draftSnapshot, 300)

	useEffect(() => {
		if (!open || !isCreate || !currentUserId || !subjectId) return
		if (skipNextDraftWrite.current) {
			skipNextDraftWrite.current = false
			return
		}
		writeExtraAssignmentDraft(currentUserId, subjectId, {
			title: debouncedDraft.title,
			levelId: debouncedDraft.levelId,
			stepId: debouncedDraft.stepId,
			content: debouncedDraft.content,
		})
	}, [open, isCreate, currentUserId, subjectId, debouncedDraft])

	const handleDismissKeepDraft = () => {
		if (isCreate && currentUserId && subjectId) {
			writeExtraAssignmentDraft(currentUserId, subjectId, {
				title,
				levelId,
				stepId,
				content,
			})
		}
		onCancel()
	}

	const handleCancelClearDraft = () => {
		if (isCreate && currentUserId && subjectId) {
			clearExtraAssignmentDraft(currentUserId, subjectId)
		}
		onCancel()
	}

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
			onCancel={handleDismissKeepDraft}
			maskClosable={false}
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
						<Button onClick={handleCancelClearDraft}>Отмена</Button>
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
						key={editorKey}
						initialContent={content}
						onChange={setContent}
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
