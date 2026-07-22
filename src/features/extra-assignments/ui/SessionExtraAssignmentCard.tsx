'use client'

import { Card, Input, Radio } from 'antd'

import type { SessionExtraAssignmentInstance } from '@/entities/extra-assignment'
import { StepContentPreview } from '@/features/program-admin/ui/StepContentPreview'
import { EMPTY_STEP_CONTENT } from '@/features/journal/lib/journal-step'
import type { StepGradeState } from '@/features/journal/ui/StepCard'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

const GRADE_OPTIONS = [
	{ label: 'Средне', value: 3 },
	{ label: 'Хорошо', value: 4 },
	{ label: 'Отлично', value: 5 },
] as const

const GRADE_LABEL = Object.fromEntries(
	GRADE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<number, string>

type SessionExtraAssignmentCardProps = {
	instance: SessionExtraAssignmentInstance
	state: StepGradeState
	readOnly?: boolean
	onStateChange: (state: StepGradeState) => void
}

export function SessionExtraAssignmentCard({
	instance,
	state,
	readOnly,
	onStateChange,
}: SessionExtraAssignmentCardProps) {
	const handleGradeChange = (grade: number) => {
		onStateChange({ ...state, grade })
	}

	const handleGradeClick = (grade: number) => {
		if (state.grade === grade) {
			onStateChange({ ...state, grade: null })
		}
	}

	const handleNoteChange = (note: string) => {
		onStateChange({ ...state, note })
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
						<>
							<Text>
								{state.grade !== null ? GRADE_LABEL[state.grade] : '—'}
							</Text>
							{state.note ? (
								<Text type="secondary">{state.note}</Text>
							) : null}
						</>
					) : (
						<>
							<Radio.Group
								value={state.grade}
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
								value={state.note}
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
