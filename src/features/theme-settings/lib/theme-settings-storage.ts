import { DEFAULT_QURAN_THEME, type QuranTheme } from './constants'

const STORAGE_KEY = 'quran-theme'

const VALID: QuranTheme[] = ['dark', 'light', 'sepia']

export function getSavedQuranTheme(): QuranTheme {
	if (typeof window === 'undefined') return DEFAULT_QURAN_THEME

	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw && VALID.includes(raw as QuranTheme)) return raw as QuranTheme
	} catch {
		/* ignore */
	}
	return DEFAULT_QURAN_THEME
}

export function setSavedQuranTheme(theme: QuranTheme) {
	localStorage.setItem(STORAGE_KEY, theme)
	window.dispatchEvent(new Event('quran-theme-change'))
}
