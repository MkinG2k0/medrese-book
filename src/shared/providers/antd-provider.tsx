"use client";

import { ConfigProvider, App } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { getAntdThemeConfig } from "@/shared/lib/antd-theme";
import {
  DEFAULT_APP_THEME,
  resolveAppTheme,
} from "@/shared/lib/app-theme";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme: nextTheme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeId = mounted
    ? resolveAppTheme(resolvedTheme ?? nextTheme)
    : DEFAULT_APP_THEME;

  // Сброс устаревших id (sepia/blue) в localStorage → light
  useEffect(() => {
    if (!mounted) return;
    const raw = nextTheme ?? resolvedTheme;
    if (raw === "sepia" || raw === "blue") {
      setTheme("light");
    }
  }, [mounted, nextTheme, resolvedTheme, setTheme]);

  return (
    <ConfigProvider
      key={themeId}
      locale={ruRU}
      theme={getAntdThemeConfig(themeId)}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
