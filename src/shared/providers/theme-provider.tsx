"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

import {
  APP_THEME_COOKIE,
  APP_THEME_IDS,
  type AppTheme,
} from "@/shared/lib/app-theme"

type ThemeProviderProps = {
  children: React.ReactNode
  initialTheme: AppTheme
}

export const ThemeProvider = ({
  children,
  initialTheme,
}: ThemeProviderProps) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem={false}
      themes={[...APP_THEME_IDS]}
      storageKey={APP_THEME_COOKIE}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
