"use client";

import { ConfigProvider, App, theme } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { getAntdThemeConfig } from "@/shared/lib/antd-theme";
import {
  DEFAULT_APP_THEME,
  isAppTheme,
  type AppTheme,
} from "@/shared/lib/app-theme";

function resolveAppTheme(value: string | undefined): AppTheme {
  if (isAppTheme(value)) return value;
  return DEFAULT_APP_THEME;
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme: nextTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeId = mounted
    ? resolveAppTheme(resolvedTheme ?? nextTheme)
    : DEFAULT_APP_THEME;

  const antdTheme = mounted
    ? getAntdThemeConfig(themeId)
    : getAntdThemeConfig(DEFAULT_APP_THEME);

  return (
    <ConfigProvider locale={ruRU} theme={antdTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
