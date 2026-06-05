import type { QueryClient } from '@tanstack/react-query'

import {
	getCurrentStepFromBundle,
	getStepDetailFromBundle,
	getStepsPageFromBundle,
	type OfflineProgramBundle,
} from '@/shared/lib/offline-program'

import { stepKeys } from '../model/step-keys'

/** Должен совпадать с STEPS_PER_SECTION в shared/lib/program-step-sections */
const STEPS_PER_PAGE = 50

/**
 * Заполняет React Query всеми уроками и страницами списка из офлайн-бандла.
 * После этого любой шаг открывается без сети, даже если его не открывали раньше.
 */
export function warmProgramCache(
	queryClient: QueryClient,
	bundle: OfflineProgramBundle,
): void {
	for (const step of bundle.steps) {
		const detail = getStepDetailFromBundle(bundle, step.id)
		if (detail) {
			queryClient.setQueryData(['step', 'detail', step.id], detail)
		}
	}

	const totalPages = Math.max(1, Math.ceil(bundle.totalPublished / STEPS_PER_PAGE))
	for (let page = 1; page <= totalPages; page++) {
		queryClient.setQueryData(
			stepKeys.page(page, STEPS_PER_PAGE),
			getStepsPageFromBundle(bundle, page, STEPS_PER_PAGE),
		)
	}

	queryClient.setQueryData(stepKeys.current(''), {
		step: getCurrentStepFromBundle(bundle, []),
	})
}
