"use client";

import { QURAN_THEME_OPTIONS } from "../lib/constants";
import { useThemeSettings } from "../model/theme-settings-context";
import { cn } from "@/shared/lib/utils";

export function ThemePicker() {
  const { theme, setTheme } = useThemeSettings();

  return (
    <div
      role="group"
      aria-label="Тема оформления"
      className="flex flex-col gap-2"
    >
      {QURAN_THEME_OPTIONS.map((opt) => {
        const selected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(opt.id)}
            className={cn("flex items-center gap-3")}
          >
            <span aria-hidden />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
