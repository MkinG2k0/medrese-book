'use client'

import { Card, Tag } from 'antd'

import Text from '@/shared/ui/Text'
import Link from 'next/link'

type StudentCardProps = {
	id: string
	name: string
	currentStepIdx: number
	hasSessionToday?: boolean
}

export function StudentCard({
	id,
	name,
	currentStepIdx,
	hasSessionToday,
}: StudentCardProps) {
	return (
		<Link href={`/journal/${id}`}>
			<Card hoverable className="!bg-[#161412] !border-[#2a2622]">
				<div className="flex items-center justify-between">
					<Text className="text-[#E8E0D0]">{name}</Text>
					<div className="flex gap-2">
						<Tag>Шаг {currentStepIdx + 1}</Tag>
						{hasSessionToday && <Tag color="green">Отмечен</Tag>}
					</div>
				</div>
			</Card>
		</Link>
	)
}
