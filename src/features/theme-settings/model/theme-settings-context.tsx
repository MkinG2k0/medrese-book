'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'

import { DEFAULT_QURAN_THEME, type QuranTheme } from '../lib/constants'
import {
	getSavedQuranTheme,
	setSavedQuranTheme,
} from '../lib/theme-settings-storage'

interface ThemeSettingsContextValue {
	theme: QuranTheme
	setTheme: (theme: QuranTheme) => void
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null)

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<QuranTheme>(() =>
		typeof window !== 'undefined' ? getSavedQuranTheme() : DEFAULT_QURAN_THEME,
	)

	useEffect(() => {
		const onChange = () => setThemeState(getSavedQuranTheme())
		window.addEventListener('quran-theme-change', onChange)
		return () => window.removeEventListener('quran-theme-change', onChange)
	}, [])

	const setTheme = useCallback((next: QuranTheme) => {
		setThemeState(next)
		setSavedQuranTheme(next)
	}, [])

	const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

	return (
		<ThemeSettingsContext.Provider value={value}>
			<div
				className="quran-student-shell min-h-screen bg-[var(--quran-bg)] text-[var(--quran-fg)]"
				data-quran-theme={theme}
			>
				{children}
			</div>
		</ThemeSettingsContext.Provider>
	)
}

export function useThemeSettings() {
	const ctx = useContext(ThemeSettingsContext)
	if (!ctx) {
		throw new Error('useThemeSettings must be used within ThemeSettingsProvider')
	}
	return ctx
}
