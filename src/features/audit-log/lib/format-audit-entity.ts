import type { AuditEventListItem } from '@/entities/audit-event/model/types'
import { getAuditEntityTypeLabel } from '@/features/audit-log/lib/audit-labels'

const GRADE_LABEL: Record<number, string> = {
	3: 'Средне',
	4: 'Хорошо',
	5: 'Отлично',
}

export function formatAuditEntitySummary(record: AuditEventListItem): string {
	if (record.entityType === 'User') {
		return `${getAuditEntityTypeLabel(record.entityType)} — ${record.actorName}`
	}

	if (record.entityType === 'StepCompletion') {
		const parts: string[] = [getAuditEntityTypeLabel(record.entityType)]
		const studentName = record.payload.studentName
		if (typeof studentName === 'string') parts.push(studentName)

		const stepTitle = record.payload.stepTitle
		if (typeof stepTitle === 'string') parts.push(`«${stepTitle}»`)

		const grade = record.payload.grade
		if (typeof grade === 'number') {
			parts.push(GRADE_LABEL[grade] ?? String(grade))
		}

		return parts.join(' · ')
	}

	return `${getAuditEntityTypeLabel(record.entityType)} · ${record.entityId.slice(0, 8)}…`
}

export function formatAuditGradeLabel(grade: unknown): string | null {
	if (typeof grade !== 'number') return null
	return GRADE_LABEL[grade] ?? String(grade)
}
