"use client";

import { AntdProvider } from "./antd-provider";
import { AuthSessionProvider } from "./session-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthSessionProvider>
      <ThemeProvider>
        <AntdProvider>
          <QueryProvider>
            <div className="h-full min-h-screen">{children}</div>
          </QueryProvider>
        </AntdProvider>
      </ThemeProvider>
    </AuthSessionProvider>
  );
};
