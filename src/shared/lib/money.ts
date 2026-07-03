const KOPECKS_PER_RUBLE = 100

export function rublesToKopecks(rubles: number): number {
	return Math.round(rubles * KOPECKS_PER_RUBLE)
}

export function kopecksToRubles(kopecks: number): number {
	return kopecks / KOPECKS_PER_RUBLE
}

export function formatMoney(kopecks: number): string {
	const sign = kopecks < 0 ? '−' : ''
	const abs = Math.abs(kopecks)
	const rubles = Math.floor(abs / KOPECKS_PER_RUBLE)
	const kop = abs % KOPECKS_PER_RUBLE
	if (kop === 0) {
		return `${sign}${rubles.toLocaleString('ru-RU')} ₽`
	}
	return `${sign}${rubles.toLocaleString('ru-RU')},${String(kop).padStart(2, '0')} ₽`
}

export function parseMoneyInput(value: string): number | null {
	const normalized = value.trim().replace(/\s/g, '').replace(',', '.')
	if (!normalized) return null
	const rubles = Number.parseFloat(normalized)
	if (!Number.isFinite(rubles) || rubles < 0) return null
	return rublesToKopecks(rubles)
}

export function calcSalaryAmountKopecks(
	totalMinutes: number,
	hourlyRateKopecks: number,
): number {
	if (totalMinutes <= 0 || hourlyRateKopecks <= 0) return 0
	return Math.round((totalMinutes * hourlyRateKopecks) / 60)
}
