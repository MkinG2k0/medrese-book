import type { DomainEventAction } from '@/shared/lib/domain-events/types'

const ACTION_LABELS: Record<string, string> = {
	STUDENT_PROGRESS_CHANGED: 'Изменён прогресс ученика',
	STUDENT_STATUS_CHANGED: 'Изменён статус ученика',
	STUDENT_CREATED: 'Создан ученик',
	STUDENT_UPDATED: 'Обновлён ученик',
	SESSION_SAVED: 'Сохранена сессия урока',
	COMPLETION_CHANGED: 'Изменена оценка шага',
	USER_LOGIN: 'Вход в систему',
	USER_LOGOUT: 'Выход из системы',
	LESSON_STARTED: 'Начат урок',
	LESSON_ENDED: 'Завершён урок',
	LEAVE_REQUEST_CREATED: 'Создана заявка на отпуск',
	LEAVE_REQUEST_APPROVED: 'Заявка на отпуск одобрена',
	LEAVE_REQUEST_REJECTED: 'Заявка на отпуск отклонена',
	SUBSTITUTION_ACTIVATED: 'Активировано замещение',
	MESSAGE_RECEIVED: 'Получено сообщение',
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
	Student: 'Ученик',
	Session: 'Сессия',
	StepCompletion: 'Оценка шага',
	User: 'Пользователь',
	LeaveRequest: 'Заявка на отпуск',
	Substitution: 'Замещение',
	Conversation: 'Диалог',
	TeachingSession: 'Урок',
	Message: 'Сообщение',
}

export const KNOWN_AUDIT_ACTIONS = Object.keys(
	ACTION_LABELS,
) as DomainEventAction[]

export const KNOWN_ENTITY_TYPES = Object.keys(ENTITY_TYPE_LABELS)

export function getAuditActionLabel(action: string): string {
	return ACTION_LABELS[action] ?? action
}

export function getAuditEntityTypeLabel(entityType: string): string {
	return ENTITY_TYPE_LABELS[entityType] ?? entityType
}

export function buildAuditActionOptions() {
	return KNOWN_AUDIT_ACTIONS.map((value) => ({
		value,
		label: getAuditActionLabel(value),
	})).sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}

export function buildAuditEntityTypeOptions() {
	return KNOWN_ENTITY_TYPES.map((value) => ({
		value,
		label: getAuditEntityTypeLabel(value),
	})).sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}
