'use client'

import { Button } from 'antd'
import { useState } from 'react'

import { useLeaveRequests } from '@/entities/leave-request/api/use-leave-requests'
import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import { LeaveCalendar } from '@/features/leave-requests/ui/LeaveCalendar'
import type { LeaveRequestType } from '@/shared/lib/prisma'
import Title from '@/shared/ui/Title'

export function TeacherLeaveCalendarPage() {
	const { data: requests = [], isLoading } = useLeaveRequests()
	const [createLeaveType, setCreateLeaveType] = useState<LeaveRequestType | null>(
		null,
	)
	const [selectedRequest, setSelectedRequest] =
		useState<LeaveRequestListItem | null>(null)

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Title level={3} className="!mb-0">
					Календарь
				</Title>
				<div className="flex flex-wrap gap-2">
					<Button
						type="primary"
						onClick={() => setCreateLeaveType('VACATION')}
					>
						Создать отпуск
					</Button>
					<Button type="primary" onClick={() => setCreateLeaveType('DAY_OFF')}>
						Создать отгул
					</Button>
					<Button
						type="primary"
						onClick={() => setCreateLeaveType('SICK_LEAVE')}
					>
						Создать больничный
					</Button>
				</div>
			</div>

			<LeaveCalendar
				requests={requests}
				loading={isLoading}
				onDateClick={setSelectedRequest}
			/>

			{createLeaveType != null && (
				<span className="sr-only">{createLeaveType}</span>
			)}
			{selectedRequest != null && (
				<span className="sr-only">{selectedRequest.id}</span>
			)}
		</div>
	)
}
