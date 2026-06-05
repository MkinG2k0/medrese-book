'use client'

import { Input, InputNumber } from 'antd'

import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type StepCardProps = {
	title: string
	grade: number | null
	note: string
	onGradeChange: (grade: number | null) => void
	onNoteChange: (note: string) => void
}

export function StepCard({
	title,
	grade,
	note,
	onGradeChange,
	onNoteChange,
}: StepCardProps) {
	return (
		<div className="rounded-lg border border-[#2a2622] p-4">
			<Title level={5} className="!mb-2">
				{title}
			</Title>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<Text>Оценка (1–5):</Text>
					<InputNumber
						min={1}
						max={5}
						value={grade}
						onChange={(v) => onGradeChange(v)}
					/>
				</div>
				<Input.TextArea
					placeholder="Заметка"
					value={note}
					onChange={(e) => onNoteChange(e.target.value)}
					rows={2}
				/>
			</div>
		</div>
	)
}
