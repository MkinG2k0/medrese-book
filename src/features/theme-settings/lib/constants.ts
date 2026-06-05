export type QuranTheme = 'dark' | 'light' | 'sepia'

export const DEFAULT_QURAN_THEME: QuranTheme = 'light'

export const QURAN_THEME_OPTIONS: { id: QuranTheme; label: string }[] = [
	{ id: 'dark', label: 'Тёмная' },
	{ id: 'light', label: 'Светлая' },
	{ id: 'sepia', label: 'Сепия' },
]
