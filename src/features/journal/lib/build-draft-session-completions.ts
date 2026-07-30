import type { StepGradeState } from '@/features/journal/ui/StepCard'

type Attendance = 'PRESENT' | 'LATE' | 'ABSENT'

type DraftStep = {
	id: string
}

export type DraftSessionCompletion = {
	stepId: string
	grade: number
	note: string | null
}

export function buildDraftSessionCompletions(
	attendance: Attendance,
	steps: DraftStep[],
	stepStates: Record<string, StepGradeState | undefined>,
): DraftSessionCompletion[] {
	if (attendance === 'ABSENT') return []

	return steps
		.filter((step) => stepStates[step.id]?.grade != null)
		.map((step) => {
			const state = stepStates[step.id]!
			return {
				stepId: step.id,
				grade: state.grade!,
				note: state.note.trim() ? state.note : null,
			}
		})
}
