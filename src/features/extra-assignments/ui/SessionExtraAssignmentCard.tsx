'use client'

import { DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Popconfirm } from 'antd'

import type { SessionExtraAssignmentInstance } from '@/entities/extra-assignment'
import { StepContentPreview } from '@/features/program-admin/ui/StepContentPreview'
import { EMPTY_STEP_CONTENT } from '@/features/journal/lib/journal-step'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type SessionExtraAssignmentCardProps = {
	instance: SessionExtraAssignmentInstance
	readOnly?: boolean
	deleting?: boolean
	onDelete?: (instanceId: string) => void
}

export function SessionExtraAssignmentCard({
	instance,
	readOnly,
	deleting,
	onDelete,
}: SessionExtraAssignmentCardProps) {
	return (
		<Card
			size="small"
			className="border-dashed !border-[#b7d4c0] !bg-[#eaf5ee] dark:!border-[#434343] dark:!bg-[#2a2a2a]"
		>
			<div className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex min-w-0 flex-col gap-1">
						<Title level={5} className="!mb-0">
							{instance.template.title}
						</Title>
						<Text type="secondary">Автор: {instance.template.author.name}</Text>
					</div>
					{!readOnly && onDelete ? (
						<Popconfirm
							title="Удалить доп. задание?"
							description="Назначение будет снято с ученика."
							okText="Удалить"
							cancelText="Отмена"
							okButtonProps={{ danger: true }}
							onConfirm={() => onDelete(instance.id)}
						>
							<Button
								type="text"
								danger
								size="small"
								icon={<DeleteOutlined />}
								loading={deleting}
								aria-label="Удалить доп. задание"
								onClick={(e) => e.stopPropagation()}
							/>
						</Popconfirm>
					) : null}
				</div>

				<StepContentPreview
					content={instance.template.content ?? EMPTY_STEP_CONTENT}
				/>
			</div>
		</Card>
	)
}
