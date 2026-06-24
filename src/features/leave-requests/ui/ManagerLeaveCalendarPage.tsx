'use client'

import { useEffect, useState } from 'react'

import { useLeaveRequests } from '@/entities/leave-request/api/use-leave-requests'
import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import { getLeaveRequestTeachers } from '@/features/leave-requests/actions/leave-actions'
import { ApproveLeaveModal } from '@/features/leave-requests/ui/ApproveLeaveModal'
import { LeaveCalendar } from '@/features/leave-requests/ui/LeaveCalendar'
import { LeaveDetailModal } from '@/features/leave-requests/ui/LeaveDetailModal'
import { LeaveRequestsTable } from '@/features/leave-requests/ui/LeaveRequestsTable'
import { RejectLeaveModal } from '@/features/leave-requests/ui/RejectLeaveModal'
import Title from '@/shared/ui/Title'

export function ManagerLeaveCalendarPage() {
	const { data: requests = [], isLoading } = useLeaveRequests()
	const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
	const [selectedRequest, setSelectedRequest] =
		useState<LeaveRequestListItem | null>(null)
	const [approveRequest, setApproveRequest] =
		useState<LeaveRequestListItem | null>(null)
	const [rejectRequest, setRejectRequest] =
		useState<LeaveRequestListItem | null>(null)

	useEffect(() => {
		void getLeaveRequestTeachers()
			.then(setTeachers)
			.catch(() => setTeachers([]))
	}, [])

	const openApprove = (request: LeaveRequestListItem) => {
		setSelectedRequest(null)
		setApproveRequest(request)
	}

	const openReject = (request: LeaveRequestListItem) => {
		setSelectedRequest(null)
		setRejectRequest(request)
	}

	return (
		<div className="flex flex-col gap-6">
			<Title level={3} className="!mb-0">
				Календарь отпусков
			</Title>

			<LeaveCalendar
				mode="manager"
				requests={requests}
				loading={isLoading}
				onDateClick={setSelectedRequest}
			/>

			<LeaveRequestsTable
				requests={requests}
				loading={isLoading}
				teachers={teachers}
				onRowClick={setSelectedRequest}
				onApprove={openApprove}
				onReject={openReject}
			/>

			<LeaveDetailModal
				request={selectedRequest}
				variant="manager"
				onClose={() => setSelectedRequest(null)}
				onApprove={openApprove}
				onReject={openReject}
			/>

			<ApproveLeaveModal
				request={approveRequest}
				onClose={() => setApproveRequest(null)}
			/>

			<RejectLeaveModal
				request={rejectRequest}
				onClose={() => setRejectRequest(null)}
			/>
		</div>
	)
}
