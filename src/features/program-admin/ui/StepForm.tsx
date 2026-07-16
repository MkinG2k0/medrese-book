'use client'

import { Button, Form, Input, InputNumber } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { createStep, updateStep } from '@/features/program-admin/actions/program-actions'
import { programLevelPath } from '@/features/program-admin/lib/program-paths'
import { StepEditor } from '@/features/program-admin/ui/editor/StepEditor'
import type { StepContent } from '@/shared/lib/validations/step'

const EMPTY_TEACHER_NOTE: StepContent = { blocks: [{ type: 'text', value: '' }] }

type StepFormProps = {
	subjectId: string
	levelId: string
	stepId?: string
	initial?: {
		order: number
		title: string
		hours: number
		content: StepContent
		teacherNote?: StepContent
		description?: string
	}
}

export function StepForm({
	subjectId,
	levelId,
	stepId,
	initial,
}: StepFormProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [content, setContent] = useState<StepContent>(
		initial?.content ?? { blocks: [{ type: 'text', value: '' }] },
	)
	const [teacherNote, setTeacherNote] = useState<StepContent>(
		initial?.teacherNote ?? EMPTY_TEACHER_NOTE,
	)
	const [order, setOrder] = useState(initial?.order ?? 1)
	const [title, setTitle] = useState(initial?.title ?? '')
	const [hours, setHours] = useState(initial?.hours ?? 1)
	const [description, setDescription] = useState(initial?.description ?? '')

	const cancelHref = programLevelPath(subjectId, levelId)

	const handleSubmit = () => {
		startTransition(async () => {
			const payload = { levelId, order, title, content, teacherNote, description, hours }
			if (stepId) {
				await updateStep(stepId, payload)
			} else {
				await createStep(payload)
			}
			router.replace(cancelHref)
		})
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<Form layout="vertical">
				<div className="flex gap-4">
					<Form.Item label="Порядок" className="mb-0 w-24">
						<InputNumber
							className="w-full"
							value={order}
							onChange={(v) => setOrder(v ?? 1)}
							min={1}
						/>
					</Form.Item>
					<Form.Item label="Название" className="mb-0 min-w-0 flex-1">
						<Input value={title} onChange={(e) => setTitle(e.target.value)} />
					</Form.Item>
					<Form.Item label="Часы" className="mb-0 w-24">
						<InputNumber
							className="w-full"
							value={hours}
							onChange={(v) => setHours(v ?? 1)}
							min={1}
						/>
					</Form.Item>
				</div>
				<Form.Item label="Содержание">
					<StepEditor
						key={`content-${stepId ?? 'new'}`}
						initialContent={initial?.content}
						onChange={setContent}
					/>
				</Form.Item>
				<Form.Item
					label="Заметка учителя"
					extra="Методические подсказки для учителя — видны только в журнале"
				>
					<StepEditor
						key={`teacher-note-${stepId ?? 'new'}`}
						initialContent={initial?.teacherNote}
						onChange={setTeacherNote}
					/>
				</Form.Item>
				<Form.Item
					label="Описание для учителя"
					extra="Подсказка, что проверять в задании — видна только учителям"
				>
					<Input.TextArea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Например: проверить правильность произношения букв аль-ифтиха..."
						rows={3}
					/>
				</Form.Item>
				<div className="flex gap-2">
					<Button type="primary" onClick={handleSubmit} loading={isPending}>
						{stepId ? 'Сохранить' : 'Создать шаг'}
					</Button>
					<Link href={cancelHref}>
						<Button>К шагам уровня</Button>
					</Link>
				</div>
			</Form>
		</div>
	)
}
