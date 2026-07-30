"use client";

import { ConfigProvider, App } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useTheme } from "next-themes";
import { useLayoutEffect, useState } from "react";

import { getAntdThemeConfig } from "@/shared/lib/antd-theme";
import {
  persistAppThemeCookie,
  resolveAppTheme,
  type AppTheme,
} from "@/shared/lib/app-theme";

type AntdProviderProps = {
  children: React.ReactNode;
  initialTheme: AppTheme;
};

export function AntdProvider({ children, initialTheme }: AntdProviderProps) {
  const { theme: nextTheme, resolvedTheme } = useTheme();
  const [themeId, setThemeId] = useState<AppTheme>(initialTheme);

  useLayoutEffect(() => {
    const next = resolveAppTheme(resolvedTheme ?? nextTheme ?? initialTheme);
    setThemeId(next);
    persistAppThemeCookie(next);
  }, [resolvedTheme, nextTheme, initialTheme]);

  return (
    <ConfigProvider locale={ruRU} theme={getAntdThemeConfig(themeId)}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
