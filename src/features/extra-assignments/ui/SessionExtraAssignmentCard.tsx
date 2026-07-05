'use client'

import { Card, Input, Radio } from 'antd'

import type { SessionExtraAssignmentInstance } from '@/entities/extra-assignment'
import { StepContentPreview } from '@/features/program-admin/ui/StepContentPreview'
import { EMPTY_STEP_CONTENT } from '@/features/journal/lib/journal-step'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

const GRADE_OPTIONS = [
	{ label: 'Средне', value: 1 },
	{ label: 'Хорошо', value: 3 },
	{ label: 'Отлично', value: 5 },
] as const

const GRADE_LABEL = Object.fromEntries(
	GRADE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<number, string>

type SessionExtraAssignmentCardProps = {
	instance: SessionExtraAssignmentInstance
	readOnly?: boolean
	onGrade: (grade: number, note?: string | null) => void
	onClearGrade: () => void
}

export function SessionExtraAssignmentCard({
	instance,
	readOnly,
	onGrade,
	onClearGrade,
}: SessionExtraAssignmentCardProps) {
	const grade = instance.completion?.grade ?? null
	const note = instance.completion?.note ?? ''

	const handleGradeChange = (value: number) => {
		onGrade(value, note || null)
	}

	const handleGradeClick = (value: number) => {
		if (grade === value) {
			onClearGrade()
		}
	}

	const handleNoteChange = (nextNote: string) => {
		if (grade !== null) {
			onGrade(grade, nextNote || null)
		}
	}

	return (
		<Card size="small" className="border-dashed">
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1">
					<Title level={5} className="!mb-0">
						{instance.template.title}
					</Title>
					<Text type="secondary">Автор: {instance.template.author.name}</Text>
				</div>

				<StepContentPreview
					content={instance.template.content ?? EMPTY_STEP_CONTENT}
				/>

				<div className="flex flex-col gap-2">
					<Text type="secondary" className="uppercase">
						Оценка доп. задания
					</Text>
					{readOnly ? (
						<Text>{grade !== null ? GRADE_LABEL[grade] : '—'}</Text>
					) : (
						<>
							<Radio.Group
								value={grade}
								onChange={(e) => handleGradeChange(e.target.value)}
								optionType="button"
								buttonStyle="solid"
							>
								{GRADE_OPTIONS.map((opt) => (
									<Radio.Button
										key={opt.value}
										value={opt.value}
										onClick={() => handleGradeClick(opt.value)}
									>
										{opt.label}
									</Radio.Button>
								))}
							</Radio.Group>
							<Input.TextArea
								placeholder="Заметка..."
								value={note}
								onChange={(e) => handleNoteChange(e.target.value)}
								rows={2}
							/>
						</>
					)}
				</div>
			</div>
		</Card>
	)
}
