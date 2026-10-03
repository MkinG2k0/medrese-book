'use client'

import { Card, Tag } from 'antd'

import { StudentMetricsCards } from '@/features/analytics/ui/StudentMetricsCards'
import type { ParentChildEnrollmentProgress } from '@/features/parent-portal/actions/parent-actions'
import {
	STUDENT_STATUS_LABELS,
	type StudentStatus,
} from '@/shared/lib/student-status'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type ParentChildCardProps = {
	name: string
	status: StudentStatus
	enrollments: ParentChildEnrollmentProgress[]
}

export function ParentChildCard({
	name,
	status,
	enrollments,
}: ParentChildCardProps) {
	return (
		<Card>
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-3">
					<Title level={4} className="!mb-0">
						{name}
					</Title>
					<Tag>{STUDENT_STATUS_LABELS[status]}</Tag>
				</div>

				{enrollments.length === 0 ? (
					<Text type="secondary">Не зачислен в группу</Text>
				) : (
					enrollments.map((enrollment) => (
						<div
							key={enrollment.groupId}
							className="flex flex-col gap-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0"
						>
							<div>
								<Title level={5} className="!mb-0">
									{enrollment.subjectName} — {enrollment.groupName}
								</Title>
								<Text type="secondary">{enrollment.levelTitle}</Text>
							</div>

							<div>
								<Text className="mb-2 block">
									Прогресс: шаг {enrollment.currentStepIdx + 1} из{' '}
									{enrollment.totalSteps}
								</Text>
								<ProgressBar
									current={enrollment.currentStepIdx}
									total={enrollment.totalSteps}
								/>
							</div>

							<StudentMetricsCards
								metrics={enrollment.periodMetrics}
								variant="portal"
							/>
						</div>
					))
				)}
			</div>
		</Card>
	)
}
