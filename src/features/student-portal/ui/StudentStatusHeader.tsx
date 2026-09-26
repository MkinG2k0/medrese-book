'use client'

import { Alert, Tag } from 'antd'

import {
	STUDENT_STATUS_LABELS,
	type StudentStatus,
} from '@/shared/lib/student-status'
import Title from '@/shared/ui/Title'

const STATUS_TAG_COLOR: Record<StudentStatus, string> = {
	ACTIVE: 'green',
	PAUSE: 'gold',
	ARCHIVE: 'default',
}

const STATUS_ALERT: Partial<
	Record<StudentStatus, { type: 'warning' | 'info'; message: string }>
> = {
	PAUSE: {
		type: 'warning',
		message: 'Ваша учётка на паузе. Обратитесь к менеджеру или учителю.',
	},
	ARCHIVE: {
		type: 'info',
		message: 'Ваша учётка в архиве. Обратитесь к менеджеру.',
	},
}

type StudentStatusHeaderProps = {
	studentName: string
	status: StudentStatus
}

export function StudentStatusHeader({
	studentName,
	status,
}: StudentStatusHeaderProps) {
	const statusNotice = STATUS_ALERT[status]

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<Title level={3} className="!mb-0">
					{studentName}
				</Title>
				{status !== 'ACTIVE' && (
					<Tag color={STATUS_TAG_COLOR[status]}>
						{STUDENT_STATUS_LABELS[status]}
					</Tag>
				)}
			</div>
			{statusNotice ? (
				<Alert
					type={statusNotice.type}
					showIcon
					message={statusNotice.message}
				/>
			) : null}
		</div>
	)
}
