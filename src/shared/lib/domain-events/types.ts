export type DomainEventAction =
	| 'STUDENT_PROGRESS_CHANGED'
	| 'STUDENT_CREATED'
	| 'STUDENT_UPDATED'
	| 'SESSION_SAVED'
	| 'COMPLETION_CHANGED'
	| 'USER_LOGIN'
	| 'USER_LOGOUT'
	| 'LESSON_STARTED'
	| 'LESSON_ENDED'

export type DomainEvent = {
	actorId: string
	action: DomainEventAction
	entityType: string
	entityId: string
	payload: Record<string, unknown>
}
