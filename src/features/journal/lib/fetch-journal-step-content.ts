import type { StepContent } from '@/shared/lib/validations/step'

export type JournalStepContent = {
	content: StepContent
	teacherNote: StepContent
	pdfUrl: string | null
}

export async function fetchJournalStepContent(
	stepId: string,
): Promise<JournalStepContent | null> {
	const res = await fetch(
		`/api/journal/steps/${encodeURIComponent(stepId)}/content`,
	)
	const json = (await res.json()) as {
		data: JournalStepContent | null
		error: string | null
	}
	if (!res.ok || json.error || !json.data) return null
	return json.data
}
