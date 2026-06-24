import type { LeaveRequestStatus, LeaveRequestType } from '@/shared/lib/prisma'

export type LeaveRequestListItem = {
	id: string
	type: LeaveRequestType
	status: LeaveRequestStatus
	startDate: string
	endDate: string
	description: string
	rejectionReason: string | null
	teacherName: string
	substituteName: string | null
	createdAt: string
}

export type LeaveRequestFilters = {
	status?: string
	type?: string
	teacherId?: string
	from?: string
	to?: string
}
