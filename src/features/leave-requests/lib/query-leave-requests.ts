import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import type {
	LeaveRequestStatus,
	LeaveRequestType,
	Prisma,
} from '@/shared/lib/prisma'
import { prisma } from '@/shared/lib/prisma'

export type LeaveRequestListFilters = {
	status?: LeaveRequestStatus
	type?: LeaveRequestType
	teacherId?: string
	from?: Date
	to?: Date
}

export type { LeaveRequestListItem }

function buildWhereClause(
	scopeTeacherId: string | null,
	filters: LeaveRequestListFilters = {},
): Prisma.LeaveRequestWhereInput {
	const where: Prisma.LeaveRequestWhereInput = {}

	if (scopeTeacherId) {
		where.teacherId = scopeTeacherId
	} else if (filters.teacherId) {
		where.teacherId = filters.teacherId
	}

	if (filters.status) {
		where.status = filters.status
	}

	if (filters.type) {
		where.type = filters.type
	}

	if (filters.from || filters.to) {
		where.AND = [
			...(filters.to
				? [{ startDate: { lte: filters.to } }]
				: []),
			...(filters.from
				? [{ endDate: { gte: filters.from } }]
				: []),
		]
	}

	return where
}

export async function queryLeaveRequests(
	scopeTeacherId: string | null,
	filters: LeaveRequestListFilters = {},
): Promise<LeaveRequestListItem[]> {
	const requests = await prisma.leaveRequest.findMany({
		where: buildWhereClause(scopeTeacherId, filters),
		include: {
			teacher: { include: { user: true } },
			substituteTeacher: { include: { user: true } },
		},
		orderBy: [{ createdAt: 'desc' }],
	})

	return requests.map((request) => ({
		id: request.id,
		type: request.type,
		status: request.status,
		startDate: request.startDate.toISOString(),
		endDate: request.endDate.toISOString(),
		description: request.description,
		rejectionReason: request.rejectionReason,
		teacherName: request.teacher.user.name,
		substituteName: request.substituteTeacher?.user.name ?? null,
		createdAt: request.createdAt.toISOString(),
	}))
}
