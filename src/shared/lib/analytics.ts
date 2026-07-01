import { startOfMonth } from 'date-fns'

export {
	getAtRiskStudents,
	getLevelStats,
	getTopStudents,
	type LevelStats,
	type TopEntry,
} from '@/shared/lib/analytics-queries'

const MONTH_FORMAT = /^\d{4}-\d{2}$/

export function parseAnalyticsMonth(month?: string): Date {
	if (month && MONTH_FORMAT.test(month)) {
		const [year, monthIndex] = month.split('-').map(Number)
		const parsed = new Date(year, monthIndex - 1, 1)
		if (!Number.isNaN(parsed.getTime())) return startOfMonth(parsed)
	}

	return startOfMonth(new Date())
}

export function formatAnalyticsMonth(month: Date): string {
	return new Intl.DateTimeFormat('ru-RU', {
		month: 'long',
		year: 'numeric',
	}).format(month)
}
