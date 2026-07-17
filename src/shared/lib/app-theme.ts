export type AppTheme = 'light' | 'dark' | 'sage'

export const DEFAULT_APP_THEME: AppTheme = 'light'

export const APP_THEME_IDS: AppTheme[] = ['light', 'dark', 'sage']

export const APP_THEME_OPTIONS: { id: AppTheme; label: string }[] = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
  { id: 'sage', label: 'Мечеть' },
]

/** Старый id `sepia` (сепия/стекло/синяя) → светлая Ant Design. */
const THEME_ALIASES: Record<string, AppTheme> = {
  sepia: 'light',
  blue: 'light',
}

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && APP_THEME_IDS.includes(value as AppTheme)
}

export function resolveAppTheme(value: string | undefined): AppTheme {
  if (!value) return DEFAULT_APP_THEME
  if (isAppTheme(value)) return value
  return THEME_ALIASES[value] ?? DEFAULT_APP_THEME
}
