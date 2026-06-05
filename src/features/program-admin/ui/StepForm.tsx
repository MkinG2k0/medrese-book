'use client'

import { Button, Form, Input, InputNumber, Select } from 'antd'
import { useState, useTransition } from 'react'

import { createStep, updateStep } from '@/features/program-admin/actions/program-actions'
import { StepEditor } from '@/features/program-admin/ui/editor/StepEditor'
import type { StepContent } from '@/shared/lib/validations/step'

type StepFormProps = {
	levelId: string
	stepId?: string
	initial?: {
		order: number
		type: 'LETTER' | 'SURAH'
		title: string
		hours: number
		content: StepContent
	}
}

export function StepForm({ levelId, stepId, initial }: StepFormProps) {
	const [isPending, startTransition] = useTransition()
	const [content, setContent] = useState<StepContent>(
		initial?.content ?? { blocks: [{ type: 'text', value: '' }] },
	)
	const [order, setOrder] = useState(initial?.order ?? 1)
	const [type, setType] = useState<'LETTER' | 'SURAH'>(initial?.type ?? 'LETTER')
	const [title, setTitle] = useState(initial?.title ?? '')
	const [hours, setHours] = useState(initial?.hours ?? 1)

	const handleSubmit = () => {
		startTransition(async () => {
			const payload = { levelId, order, type, title, content, hours }
			if (stepId) {
				await updateStep(stepId, payload)
			} else {
				await createStep(payload)
			}
			window.location.href = `/admin/program/${levelId}`
		})
	}

	return (
		<div className="flex max-w-3xl flex-col gap-4">
			<Form layout="vertical">
				<Form.Item label="Порядок">
					<InputNumber value={order} onChange={(v) => setOrder(v ?? 1)} min={1} />
				</Form.Item>
				<Form.Item label="Тип">
					<Select
						value={type}
						onChange={setType}
						options={[
							{ value: 'LETTER', label: 'Буква' },
							{ value: 'SURAH', label: 'Сура' },
						]}
					/>
				</Form.Item>
				<Form.Item label="Название">
					<Input value={title} onChange={(e) => setTitle(e.target.value)} />
				</Form.Item>
				<Form.Item label="Часы">
					<InputNumber value={hours} onChange={(v) => setHours(v ?? 1)} min={1} />
				</Form.Item>
				<Form.Item label="Содержание">
					<StepEditor initialContent={content} onChange={setContent} />
				</Form.Item>
				<Button type="primary" onClick={handleSubmit} loading={isPending}>
					{stepId ? 'Сохранить' : 'Создать шаг'}
				</Button>
			</Form>
		</div>
	)
}
