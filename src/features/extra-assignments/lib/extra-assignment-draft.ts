import {
	stepContentSchema,
	type StepContent,
} from '@/shared/lib/validations/step'

export type ExtraAssignmentCreateDraft = {
	title: string
	levelId?: string
	stepId: string | null
	content: StepContent
}

export function draftStorageKey(userId: string, subjectId: string): string {
	return `extra-assignment-draft:${userId}:${subjectId}`
}

function isDraft(value: unknown): value is ExtraAssignmentCreateDraft {
	if (!value || typeof value !== 'object') return false
	const v = value as Record<string, unknown>
	if (typeof v.title !== 'string') return false
	if (v.levelId !== undefined && typeof v.levelId !== 'string') return false
	if (!(v.stepId === null || typeof v.stepId === 'string')) return false
	const content = stepContentSchema.safeParse(v.content)
	return content.success
}

export function readExtraAssignmentDraft(
	userId: string,
	subjectId: string,
): ExtraAssignmentCreateDraft | null {
	if (typeof window === 'undefined') return null
	if (!userId || !subjectId) return null

	try {
		const raw = localStorage.getItem(draftStorageKey(userId, subjectId))
		if (!raw) return null
		const parsed: unknown = JSON.parse(raw)
		if (!isDraft(parsed)) return null
		return {
			title: parsed.title,
			levelId: parsed.levelId,
			stepId: parsed.stepId,
			content: parsed.content,
		}
	} catch {
		return null
	}
}

export function writeExtraAssignmentDraft(
	userId: string,
	subjectId: string,
	draft: ExtraAssignmentCreateDraft,
): void {
	if (typeof window === 'undefined') return
	if (!userId || !subjectId) return

	try {
		localStorage.setItem(draftStorageKey(userId, subjectId), JSON.stringify(draft))
	} catch {
		/* ignore */
	}
}

export function clearExtraAssignmentDraft(
	userId: string,
	subjectId: string,
): void {
	if (typeof window === 'undefined') return
	if (!userId || !subjectId) return

	try {
		localStorage.removeItem(draftStorageKey(userId, subjectId))
	} catch {
		/* ignore */
	}
}
