import type {
	LeaveRequest,
	LeaveRequestStatus,
	LeaveRequestType,
	Substitution,
} from '@/shared/lib/prisma'

export type LeaveRequestDto = {
	id: string
	teacherId: string
	type: LeaveRequestType
	status: LeaveRequestStatus
	startDate: string
	endDate: string
	description: string
	rejectionReason: string | null
	substituteTeacherId: string | null
	substitutionId: string | null
	createdAt: string
	updatedAt: string
}

export type SubstitutionDto = {
	id: string
	absentTeacherId: string
	substituteTeacherId: string
	leaveRequestId: string | null
	startDate: string
	endDate: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export function serializeLeaveRequest(request: LeaveRequest): LeaveRequestDto {
	return {
		id: request.id,
		teacherId: request.teacherId,
		type: request.type,
		status: request.status,
		startDate: request.startDate.toISOString(),
		endDate: request.endDate.toISOString(),
		description: request.description,
		rejectionReason: request.rejectionReason,
		substituteTeacherId: request.substituteTeacherId,
		substitutionId: request.substitutionId,
		createdAt: request.createdAt.toISOString(),
		updatedAt: request.updatedAt.toISOString(),
	}
}

export function serializeSubstitution(
	substitution: Substitution,
): SubstitutionDto {
	return {
		id: substitution.id,
		absentTeacherId: substitution.absentTeacherId,
		substituteTeacherId: substitution.substituteTeacherId,
		leaveRequestId: substitution.leaveRequestId,
		startDate: substitution.startDate.toISOString(),
		endDate: substitution.endDate.toISOString(),
		isActive: substitution.isActive,
		createdAt: substitution.createdAt.toISOString(),
		updatedAt: substitution.updatedAt.toISOString(),
	}
}
