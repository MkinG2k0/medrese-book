import type { StepDetail } from '@/entities/step'
import {
	sectionPageBounds,
	totalSectionPages,
} from '@/shared/lib/program-step-sections'
import type { StepMeta } from '@/shared/lib/student-progress-storage'

import type { OfflineProgramBundle } from './types'

export function getStepFromBundle(
	bundle: OfflineProgramBundle,
	stepId: number,
): StepDetail | null {
	return bundle.steps.find((step) => step.id === stepId) ?? null
}

export function getStepDetailFromBundle(
	bundle: OfflineProgramBundle,
	stepId: number,
): { step: StepDetail; nextStepId: number | null } | null {
	const step = getStepFromBundle(bundle, stepId)
	if (!step) return null
	return {
		step: { ...step, totalPublished: bundle.totalPublished },
		nextStepId: getNextStepId(bundle, stepId),
	}
}

export function getNextStepId(
	bundle: OfflineProgramBundle,
	stepId: number,
): number | null {
	const current = getStepFromBundle(bundle, stepId)
	if (!current) return null
	const next = bundle.steps.find((step) => step.order > current.order)
	return next?.id ?? null
}

export function getStepsPageFromBundle(
	bundle: OfflineProgramBundle,
	page: number,
	limit: number,
): {
	steps: StepMeta[]
	totalPublished: number
	page: number
	limit: number
	totalPages: number
} {
	const { skip, take } = sectionPageBounds(page, limit, bundle.totalPublished)
	const steps = bundle.steps.slice(skip, skip + take).map((step) => ({
		id: step.id,
		order: step.order,
		title: step.title,
		subtitle: step.subtitle,
	}))

	const totalPages = totalSectionPages(bundle.totalPublished, limit)

	return {
		steps,
		totalPublished: bundle.totalPublished,
		page,
		limit,
		totalPages,
	}
}

export function getCurrentStepFromBundle(
	bundle: OfflineProgramBundle,
	excludeIds: number[],
): StepMeta | null {
	const exclude = new Set(excludeIds)
	const step = bundle.steps.find((item) => !exclude.has(item.id))
	if (!step) return null
	return {
		id: step.id,
		order: step.order,
		title: step.title,
		subtitle: step.subtitle,
	}
}
