import { fetchFromProgramBundle, getStepDetailFromBundle } from '@/shared/lib/offline-program'

import type { StepDetail } from '../model/types'

export interface StepDetailResponse {
	step: StepDetail
	nextStepId: number | null
}

export async function fetchStepDetail(stepId: number): Promise<StepDetailResponse> {
	return fetchFromProgramBundle((bundle) => getStepDetailFromBundle(bundle, stepId))
}
