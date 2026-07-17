"use client";

import { Button } from "antd";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { APP_THEME_OPTIONS, type AppTheme } from "../lib/constants";

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        role="group"
        aria-label="Тема оформления"
        className="flex flex-wrap gap-2"
      >
        {APP_THEME_OPTIONS.map((opt) => (
          <Button key={opt.id} disabled>
            {opt.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Тема оформления"
      className="flex flex-wrap gap-2"
    >
      {APP_THEME_OPTIONS.map((opt) => {
        const selected = theme === opt.id;
        return (
          <Button
            key={opt.id}
            type={selected ? "primary" : "default"}
            aria-pressed={selected}
            onClick={() => setTheme(opt.id as AppTheme)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
