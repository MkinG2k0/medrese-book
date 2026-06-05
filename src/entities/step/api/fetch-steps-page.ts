import {
	fetchFromProgramBundle,
	getStepsPageFromBundle,
} from '@/shared/lib/offline-program'
import type { StepMeta } from '@/shared/lib/student-progress-storage'

export interface StepsPageResponse {
	steps: StepMeta[]
	totalPublished: number
	page: number
	limit: number
	totalPages: number
}

export async function fetchStepsPage(
	page: number,
	limit: number,
): Promise<StepsPageResponse> {
	return fetchFromProgramBundle((bundle) =>
		getStepsPageFromBundle(bundle, page, limit),
	)
}
