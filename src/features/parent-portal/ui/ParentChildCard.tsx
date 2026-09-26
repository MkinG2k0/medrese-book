'use client'

import { Card, Tag } from 'antd'

import {
	STUDENT_STATUS_LABELS,
	type StudentStatus,
} from '@/shared/lib/student-status'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type ParentChildCardProps = {
	name: string
	status: StudentStatus
	groups: string[]
}

export function ParentChildCard({ name, status, groups }: ParentChildCardProps) {
	return (
		<Card size="small">
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-3">
					<Title level={4} className="!mb-0">
						{name}
					</Title>
					<Tag>{STUDENT_STATUS_LABELS[status]}</Tag>
				</div>
				<Text type="secondary">
					{groups.length > 0 ? groups.join(', ') : 'Не зачислен в группу'}
				</Text>
			</div>
		</Card>
	)
}
