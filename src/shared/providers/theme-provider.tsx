"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

import { APP_THEME_IDS, DEFAULT_APP_THEME } from "@/shared/lib/app-theme"

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_APP_THEME}
      enableSystem={false}
      themes={[...APP_THEME_IDS]}
      storageKey="app-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
