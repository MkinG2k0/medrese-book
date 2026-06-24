import type {
	LeaveRequestStatus,
	LeaveRequestType,
} from '@/shared/lib/prisma'

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
	CREATED: 'Создана',
	APPROVED: 'Подтверждена',
	REJECTED: 'Отклонена',
}

export const LEAVE_REQUEST_TYPE_LABELS: Record<LeaveRequestType, string> = {
	VACATION: 'Отпуск',
	DAY_OFF: 'Отгул',
	SICK_LEAVE: 'Больничный',
}

export function getLeaveRequestStatusLabel(status: LeaveRequestStatus): string {
	return LEAVE_REQUEST_STATUS_LABELS[status]
}

export function getLeaveRequestTypeLabel(type: LeaveRequestType): string {
	return LEAVE_REQUEST_TYPE_LABELS[type]
}
