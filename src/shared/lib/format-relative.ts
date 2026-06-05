export function formatRelativeActivity(date: Date | string | null): string {
	if (!date) return 'давно'
	const d = typeof date === 'string' ? new Date(date) : date
	const diffMs = Date.now() - d.getTime()
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffDays <= 0) return 'сегодня'
	if (diffDays === 1) return 'вчера'
	if (diffDays < 7) return `${diffDays} дня`
	if (diffDays < 14) return 'неделю'
	return `${Math.floor(diffDays / 7)} нед.`
}
