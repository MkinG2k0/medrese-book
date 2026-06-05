export type StepStatus = 'completed' | 'current'

export interface StepListItem {
	id: number
	order: number
	title: string
	subtitle: string | null
	status?: StepStatus
}

export interface StepBlockView {
	id?: number
	type: string
	value?: string | null
	imageUrl?: string | null
	caption?: string | null
	translation?: string | null
	src?: string
}

export interface StepDetail {
	id: number
	order: number
	title: string
	subtitle: string | null
	isPublished: boolean
	blocks: StepBlockView[]
	totalPublished?: number
}
