import {
	getCalendarDayQueryRange,
	getLocalDateString,
	isSameCalendarDay,
} from '@/shared/lib/calendar-date'
import type { StepContent } from '@/shared/lib/validations/step'

export const EMPTY_STEP_CONTENT: StepContent = { blocks: [] }

export function hasVisibleStepContent(content: StepContent): boolean {
	return content.blocks.some((block) => {
		if (block.type === 'text' || block.type === 'arabic') {
			return block.value.trim().length > 0
		}
		if (block.type === 'image') return block.url.trim().length > 0
		if (block.type === 'list') {
			return block.items.some((item) => item.trim().length > 0)
		}
		return false
	})
}

export type JournalStepMeta = {
	id: string
	order: number
	title: string
	description: string
	hours: number
	levelNumber: number
	levelTitle: string
}

export type JournalStep = JournalStepMeta & {
	content: StepContent
}

export function mapStepMeta(
	step: {
		id: string
		order: number
		title: string
		description: string
		hours: number
	},
	levelNumber: number,
	levelTitle: string,
): JournalStep {
	return {
		id: step.id,
		order: step.order,
		title: step.title,
		description: step.description,
		hours: step.hours,
		levelNumber,
		levelTitle,
		content: EMPTY_STEP_CONTENT,
	}
}

export function getLessonCalendarDay(date: Date = new Date()) {
	return getLocalDateString(date)
}

export function getLessonDayRange(dateStr: string) {
	return getCalendarDayQueryRange(dateStr)
}

export function isLessonCalendarDay(date: Date, dateStr: string) {
	return isSameCalendarDay(date, dateStr)
}
