'use client'

import { Button } from 'antd'
import { useState } from 'react'

import { useLeaveRequests } from '@/entities/leave-request/api/use-leave-requests'
import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import { CreateLeaveModal } from '@/features/leave-requests/ui/CreateLeaveModal'
import { EditLeaveModal } from '@/features/leave-requests/ui/EditLeaveModal'
import { LeaveCalendar } from '@/features/leave-requests/ui/LeaveCalendar'
import { LeaveDetailModal } from '@/features/leave-requests/ui/LeaveDetailModal'
import { TeacherLeaveRequestsTable } from '@/features/leave-requests/ui/TeacherLeaveRequestsTable'
import type { LeaveRequestType } from '@/shared/lib/prisma'
import Title from '@/shared/ui/Title'

export function TeacherLeaveCalendarPage() {
	const { data: requests = [], isLoading } = useLeaveRequests()
	const [createLeaveType, setCreateLeaveType] = useState<LeaveRequestType | null>(
		null,
	)
	const [selectedRequest, setSelectedRequest] =
		useState<LeaveRequestListItem | null>(null)
	const [editingRequest, setEditingRequest] =
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

			<TeacherLeaveRequestsTable
				requests={requests}
				loading={isLoading}
				onRowClick={setSelectedRequest}
				onEdit={setEditingRequest}
			/>

			{createLeaveType != null && (
				<CreateLeaveModal
					open
					leaveType={createLeaveType}
					onClose={() => setCreateLeaveType(null)}
				/>
			)}

			<EditLeaveModal
				request={editingRequest}
				onClose={() => setEditingRequest(null)}
			/>

			<LeaveDetailModal
				request={selectedRequest}
				onClose={() => setSelectedRequest(null)}
				onEdit={
					selectedRequest &&
					(selectedRequest.status === 'CREATED' ||
						selectedRequest.status === 'REJECTED')
						? () => {
								setEditingRequest(selectedRequest)
								setSelectedRequest(null)
							}
						: undefined
				}
			/>
		</div>
	)
}
