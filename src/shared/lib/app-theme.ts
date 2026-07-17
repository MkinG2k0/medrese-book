export type AppTheme = 'light' | 'dark' | 'sage'

export const DEFAULT_APP_THEME: AppTheme = 'light'

export const APP_THEME_IDS: AppTheme[] = ['light', 'dark', 'sage']

export const APP_THEME_OPTIONS: { id: AppTheme; label: string }[] = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
  { id: 'sage', label: 'Мечеть' },
]

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && APP_THEME_IDS.includes(value as AppTheme)
}
