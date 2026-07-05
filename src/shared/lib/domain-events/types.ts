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
	| 'MESSAGE_RECEIVED'
	| 'POST_PUBLISHED'
	| 'TUITION_PAYMENT_CREATED'
	| 'TUITION_PAYMENT_REVERSED'
	| 'TUITION_CHARGES_GENERATED'
	| 'EXPENSE_CREATED'
	| 'EXPENSE_REVERSED'
	| 'DONATION_CREATED'
	| 'DONATION_REVERSED'
	| 'SALARY_ACCRUAL_CONFIRMED'
	| 'SALARY_PAYOUT_CREATED'
	| 'SALARY_PAYOUT_REVERSED'
	| 'MONTH_CLOSED'
	| 'TEACHING_SESSION_DURATION_ADJUSTED'

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
