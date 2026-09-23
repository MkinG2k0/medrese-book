'use client'

import { Card } from 'antd'

import type { SessionExtraAssignmentInstance } from '@/entities/extra-assignment'
import { StepContentPreview } from '@/features/program-admin/ui/StepContentPreview'
import { EMPTY_STEP_CONTENT } from '@/features/journal/lib/journal-step'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type SessionExtraAssignmentCardProps = {
	instance: SessionExtraAssignmentInstance
}

export function SessionExtraAssignmentCard({
	instance,
}: SessionExtraAssignmentCardProps) {
	return (
		<Card
			size="small"
			className="border-dashed !border-[#b7d4c0] !bg-[#eaf5ee] dark:!border-[#434343] dark:!bg-[#2a2a2a]"
		>
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
			</div>
		</Card>
	)
}
