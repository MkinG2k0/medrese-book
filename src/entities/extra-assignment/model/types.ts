import type { StepContent } from '@/shared/lib/validations/step'

export type ExtraAssignmentAuthor = {
	id: string
	name: string
}

export type ExtraAssignmentStep = {
	id: string
	order: number
	title: string
	levelId: string
	level: {
		number: number
		title: string
	}
} | null

export type ExtraAssignmentTemplate = {
	id: string
	title: string
	content: StepContent
	stepId: string | null
	authorId: string
	isSystem: boolean
	createdAt: string
	updatedAt: string
	author: ExtraAssignmentAuthor
	step: ExtraAssignmentStep
}

export type ExtraAssignmentCompletion = {
	id: string
	grade: number
	note: string | null
	gradedAt: string
	createdAt: string
} | null

export type SessionExtraAssignmentInstance = {
	id: string
	templateId: string
	studentId: string
	sessionId: string
	displayStepId: string
	assignedById: string
	createdAt: string
	template: {
		id: string
		title: string
		content: StepContent
		author: ExtraAssignmentAuthor
		step: ExtraAssignmentStep
	}
	completion: ExtraAssignmentCompletion
}

export type ExtraAssignmentHistoryRow = {
	id: string
	createdAt: string
	displayStep: {
		order: number
		title: string
	}
	template: {
		title: string
		author: ExtraAssignmentAuthor
	}
	completion: ExtraAssignmentCompletion
	session: {
		date: string
	}
}
