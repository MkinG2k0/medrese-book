export function formatMinutesAsHours(minutes: number): string {
	if (minutes <= 0) return '0'

	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60

	if (hours === 0) return `${mins} мин`
	if (mins === 0) return `${hours} ч`
	return `${hours} ч ${mins} мин`
}
