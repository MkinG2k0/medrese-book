'use client'

import {
	CheckOutlined,
	ClockCircleOutlined,
	CloseOutlined,
	DownOutlined,
	RightOutlined,
} from '@ant-design/icons'
import { Card, Checkbox, Flex, Input, Radio, Tag } from 'antd'

import { LetterContent } from '@/features/journal/ui/StepContent/LetterContent'
import { SurahContent } from '@/features/journal/ui/StepContent/SurahContent'
import type { StepContent } from '@/shared/lib/validations/step'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

const GRADE_OPTIONS = [
	{ label: 'Средне', value: 3 },
	{ label: 'Хорошо', value: 4 },
	{ label: 'Отлично', value: 5 },
] as const

const STEP_TYPE_LABEL: Record<'LETTER' | 'SURAH', string> = {
	LETTER: 'Буквы',
	SURAH: 'Сура',
}

export type StepGradeState = {
	selected: boolean
	grade: number | null
	note: string
}

type StepCardProps = {
	step: {
		id: string
		order: number
		title: string
		type: 'LETTER' | 'SURAH'
		content: StepContent
		hours: number
	}
	totalHours: number
	expanded: boolean
	state: StepGradeState
	disabled?: boolean
	onToggleExpand: () => void
	onStateChange: (state: StepGradeState) => void
}

export function StepCard({
	step,
	totalHours,
	expanded,
	state,
	disabled,
	onToggleExpand,
	onStateChange,
}: StepCardProps) {
	const handleGradeChange = (grade: number) => {
		onStateChange({ ...state, grade, selected: true })
	}

	const handleSelectedChange = (selected: boolean) => {
		onStateChange({ ...state, selected })
	}

	const handleNoteChange = (note: string) => {
		onStateChange({ ...state, note })
	}

	return (
		<Card className="w-full">
			<Flex vertical gap={8}>
				<Flex align="flex-start" gap={12}>
					<Checkbox
						checked={state.selected}
						disabled={disabled}
						onChange={(e) => handleSelectedChange(e.target.checked)}
						className="mt-1"
					/>
					<Flex vertical gap={4} className="min-w-0 flex-1">
						<Flex align="center" justify="space-between" gap={8}>
							<Flex align="center" gap={8} wrap>
								<Title level={5} className="!mb-0">
									Шаг {step.order}
								</Title>
								<Tag>{STEP_TYPE_LABEL[step.type]}</Tag>
								{state.grade !== null && <Tag color="orange">пройден</Tag>}
							</Flex>
							<Flex
								align="center"
								gap={8}
								className="shrink-0 cursor-pointer"
								onClick={onToggleExpand}
							>
								<Flex vertical align="flex-end" gap={0}>
									<Text type="secondary">{step.hours}ч</Text>
									<Text type="secondary">итого {totalHours}</Text>
								</Flex>
								{expanded ? <DownOutlined /> : <RightOutlined />}
							</Flex>
						</Flex>
						<Text type="secondary" className="cursor-pointer" onClick={onToggleExpand}>
							{step.title}
						</Text>
					</Flex>
				</Flex>

				{expanded && !disabled && (
					<Flex vertical gap={16} className="pt-2">
						<div className="rounded-lg border border-[#2a2622] p-4">
							{step.type === 'LETTER' ? (
								<LetterContent content={step.content} />
							) : (
								<SurahContent content={step.content} />
							)}
						</div>

						<Flex vertical gap={8}>
							<Text type="secondary" className="uppercase">
								Оценка
							</Text>
							<Radio.Group
								value={state.grade}
								onChange={(e) => handleGradeChange(e.target.value)}
								optionType="button"
								buttonStyle="solid"
							>
								{GRADE_OPTIONS.map((opt) => (
									<Radio.Button key={opt.value} value={opt.value}>
										{opt.label}
									</Radio.Button>
								))}
							</Radio.Group>
							<Input.TextArea
								placeholder="Заметка учителя..."
								value={state.note}
								onChange={(e) => handleNoteChange(e.target.value)}
								rows={2}
							/>
						</Flex>
					</Flex>
				)}
			</Flex>
		</Card>
	)
}
