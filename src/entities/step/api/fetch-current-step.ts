import {
	fetchFromProgramBundle,
	getCurrentStepFromBundle,
} from '@/shared/lib/offline-program'
import type { StepMeta } from '@/shared/lib/student-progress-storage'

export interface CurrentStepResponse {
	step: StepMeta | null
}

export async function fetchCurrentStep(
	excludeIds: number[],
): Promise<CurrentStepResponse> {
	return fetchFromProgramBundle((bundle) => ({
		step: getCurrentStepFromBundle(bundle, excludeIds),
	}))
}
