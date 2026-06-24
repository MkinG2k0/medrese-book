import {
	queryLeaveRequests,
	type LeaveRequestListFilters,
} from '@/features/leave-requests/lib/query-leave-requests'
import { forbidden, success } from '@/shared/api'
import { authorizeApiRequest } from '@/shared/lib/authorize-api-request'
import type { LeaveRequestStatus, LeaveRequestType } from '@/shared/lib/prisma'

function parseFilters(searchParams: URLSearchParams): LeaveRequestListFilters {
	const filters: LeaveRequestListFilters = {}

	const status = searchParams.get('status')
	if (status) {
		filters.status = status as LeaveRequestStatus
	}

	const type = searchParams.get('type')
	if (type) {
		filters.type = type as LeaveRequestType
	}

	const teacherId = searchParams.get('teacherId')
	if (teacherId) {
		filters.teacherId = teacherId
	}

	const from = searchParams.get('from')
	if (from) {
		filters.from = new Date(from)
	}

	const to = searchParams.get('to')
	if (to) {
		filters.to = new Date(to)
	}

	return filters
}

export async function GET(request: Request) {
	const authResult = await authorizeApiRequest({
		allowedRoles: ['TEACHER', 'MANAGER', 'SUPER_ADMIN'],
	})
	if ('error' in authResult) return authResult.error

	const { session } = authResult
	const filters = parseFilters(new URL(request.url).searchParams)

	if (session.user.role === 'TEACHER') {
		const teacherId = session.user.teacherId
		if (!teacherId) {
			return forbidden()
		}
		if (filters.teacherId && filters.teacherId !== teacherId) {
			return forbidden()
		}

		const data = await queryLeaveRequests(teacherId, filters)
		return success(data)
	}

	const data = await queryLeaveRequests(null, filters)
	return success(data)
}
