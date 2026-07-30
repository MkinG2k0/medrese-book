export type AppTheme = 'light' | 'dark' | 'sage'

export const DEFAULT_APP_THEME: AppTheme = 'dark'

/** Совпадает с storageKey next-themes — SSR читает ту же тему, что и клиент. */
export const APP_THEME_COOKIE = 'app-theme'

export const APP_THEME_IDS: AppTheme[] = ['light', 'dark', 'sage']

export const APP_THEME_OPTIONS: { id: AppTheme; label: string }[] = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
  { id: 'sage', label: 'Мечеть' },
]

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && APP_THEME_IDS.includes(value as AppTheme)
}

export function resolveAppTheme(value: unknown): AppTheme {
  return isAppTheme(value) ? value : DEFAULT_APP_THEME
}

/** Пишет тему в cookie, чтобы следующий SSR совпал с localStorage. */
export function persistAppThemeCookie(theme: AppTheme): void {
  if (typeof document === 'undefined') return
  document.cookie = `${APP_THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`
}
