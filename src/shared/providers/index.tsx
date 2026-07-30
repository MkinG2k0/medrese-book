"use client";

import type { AppTheme } from "@/shared/lib/app-theme";

import { AntdProvider } from "./antd-provider";
import { AuthSessionProvider } from "./session-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

type ProvidersProps = {
  children: React.ReactNode;
  initialTheme: AppTheme;
};

export const Providers = ({ children, initialTheme }: ProvidersProps) => {
  return (
    <AuthSessionProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <AntdProvider initialTheme={initialTheme}>
          <QueryProvider>
            <div className="h-full min-h-screen">{children}</div>
          </QueryProvider>
        </AntdProvider>
      </ThemeProvider>
    </AuthSessionProvider>
  );
};
