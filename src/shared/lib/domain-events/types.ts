export type DomainEventAction =
	| 'STUDENT_PROGRESS_CHANGED'
	| 'STUDENT_STATUS_CHANGED'
	| 'STUDENT_CREATED'
	| 'STUDENT_UPDATED'
	| 'SESSION_SAVED'
	| 'COMPLETION_CHANGED'
	| 'USER_LOGIN'
	| 'USER_LOGOUT'
	| 'LESSON_STARTED'
	| 'LESSON_ENDED'
	| 'LEAVE_REQUEST_CREATED'
	| 'LEAVE_REQUEST_APPROVED'
	| 'LEAVE_REQUEST_REJECTED'
	| 'SUBSTITUTION_ACTIVATED'

export type LeaveDomainEventPayload = {
	teacherId: string
	substituteTeacherId?: string | null
	startDate: string
	endDate: string
	type: 'VACATION' | 'DAY_OFF' | 'SICK_LEAVE'
}

export type DomainEvent = {
	actorId: string
	action: DomainEventAction
	entityType: string
	entityId: string
	payload: Record<string, unknown>
}
