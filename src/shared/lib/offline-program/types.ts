import type { StepDetail } from '@/entities/step'

export interface OfflineProgramBundle {
	version: string
	generatedAt: string
	totalPublished: number
	steps: StepDetail[]
	assetUrls: string[]
}
