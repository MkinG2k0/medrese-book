---
phase: 260718-3bp-4-2
plan: 01
subsystem: ui
tags: [theme, next-themes, antd, settings, e2e]

requires: []
provides:
  - AppTheme light/dark/sage/sepia with default light via next-themes
  - Antd ConfigProvider synced to resolvedTheme via getAntdThemeConfig
  - /settings page with ThemePicker + AppShell nav for all roles
  - e2e/settings-theme.spec.ts for theme switch persistence
affects: [theme-settings, app-shell, providers]

tech-stack:
  added: []
  patterns:
    - "App theme ids live in shared/lib/app-theme.ts; features/theme-settings re-exports (FSD-safe)"
    - "next-themes attribute=class storageKey=app-theme; AntdProvider reads useTheme after mount"
    - "CSS theme blocks :root/.dark/.sage/.sepia for Tailwind tokens"

key-files:
  created:
    - src/shared/lib/app-theme.ts
    - src/shared/lib/antd-theme.ts
    - src/features/theme-settings/lib/antd-theme.ts
    - src/app/(dashboard)/settings/page.tsx
    - e2e/settings-theme.spec.ts
  modified:
    - src/shared/providers/theme-provider.tsx
    - src/shared/providers/antd-provider.tsx
    - src/features/theme-settings/lib/constants.ts
    - src/features/theme-settings/ui/ThemePicker.tsx
    - src/features/theme-settings/index.ts
    - src/app/globals.css
    - src/widgets/app-shell/ui/AppShell.tsx
  deleted:
    - src/features/theme-settings/lib/theme-settings-storage.ts
    - src/features/theme-settings/model/theme-settings-context.tsx

key-decisions:
  - "Canonical AppTheme + getAntdThemeConfig in shared/lib to avoid shared→features FSD violation; feature barrel re-exports"
  - "ThemePicker rewritten on next-themes in Task 1 (Rule 3) after removing Quran context"
  - "Brand label uses text-white on hardcoded dark sider (readable across themes without full AppShell redesign)"

patterns-established:
  - "Four app themes via next-themes class on html + ConfigProvider algorithm/tokens + CSS vars"
  - "Settings at /settings; menu item Настройки appended for every role"

requirements-completed: [QUICK-app-themes-4]

coverage:
  - id: D1
    description: "4 темы light/dark/sage/sepia, default light; next-themes + Antd + CSS .sage/.sepia"
    requirement: QUICK-app-themes-4
    verification:
      - kind: other
        ref: "rg defaultTheme/themes theme-provider; getAntdThemeConfig antd-provider; .sage/.sepia globals.css"
        status: pass
    human_judgment: false
  - id: D2
    description: "/settings + ThemePicker; пункт Настройки у всех ролей"
    requirement: QUICK-app-themes-4
    verification:
      - kind: other
        ref: "rg Настройки|/settings AppShell; ThemePicker settings/page.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "E2E: nav → settings → dark/light/sage class + localStorage app-theme"
    requirement: QUICK-app-themes-4
    verification:
      - kind: e2e
        ref: "pnpm exec playwright test e2e/settings-theme.spec.ts"
        status: fail
    human_judgment: true
    rationale: "Playwright CLI fails before tests run (TypeError context.conditions?.includes) — env tooling blocker, not assertion failure"

duration: 3min
completed: 2026-07-18
status: complete
---

# Phase 260718-3bp: App themes + settings Summary

**Четыре app-wide темы (light/dark/sage/sepia, default light) через next-themes + Antd ConfigProvider + CSS-токены; страница `/settings` и пункт «Настройки» для всех ролей.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-18T02:26:11+03:00
- **Completed:** 2026-07-18T02:29:00+03:00
- **Tasks:** 3/3
- **Files modified:** 14 (created/modified/deleted in theme task scope)

## Accomplishments

- Единая система тем вместо Quran-shell (`quran-theme` storage/context удалены)
- `ThemeProvider` default light, allowlist 4 themes, `storageKey=app-theme`
- `AntdProvider` синхронизирован с `resolvedTheme`; fallback light до mount
- `/settings` + меню «Настройки» у TEACHER/MANAGER/SUPER_ADMIN/ACCOUNTANT/STUDENT
- E2E-спека написана (прогон заблокирован окружением Playwright)

## Task Commits

1. **Task 1: Модель тем + провайдеры + CSS-токены** - `8790d8c` (feat)
2. **Task 2: ThemePicker, /settings, пункт меню** - `d8ae856` (feat)
3. **Task 3: Playwright e2e смены темы** - `9088465` (test)

## Files Created/Modified

- `src/shared/lib/app-theme.ts` — AppTheme union, labels, allowlist, isAppTheme
- `src/shared/lib/antd-theme.ts` — getAntdThemeConfig(algorithm + tokens)
- `src/features/theme-settings/lib/*` — re-exports; ThemePicker on next-themes
- `src/shared/providers/theme-provider.tsx` / `antd-provider.tsx` — wired
- `src/app/globals.css` — `.sage` / `.sepia` token blocks
- `src/app/(dashboard)/settings/page.tsx` — страница настроек
- `src/widgets/app-shell/ui/AppShell.tsx` — nav + brand text
- `e2e/settings-theme.spec.ts` — e2e сценарий

## Decisions Made

- Канон темы в `shared/lib` (eslint FSD: shared не импортирует features)
- ThemePicker переведён на next-themes уже в Task 1 после удаления context
- Бренд сайдбара: `text-white` (sider остаётся тёмным `#12100e`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] FSD: shared не может импортировать features**
- **Found during:** Task 1
- **Issue:** План клал `getAntdThemeConfig`/constants в features, а providers в shared их импортировали — нарушение eslint layer rules
- **Fix:** Канон в `src/shared/lib/app-theme.ts` + `antd-theme.ts`; feature paths re-export
- **Files modified:** `src/shared/lib/app-theme.ts`, `src/shared/lib/antd-theme.ts`, feature re-exports, providers
- **Committed in:** `8790d8c`

**2. [Rule 3 - Blocking] ThemePicker зависел от удалённого Quran context**
- **Found during:** Task 1
- **Issue:** Удаление `theme-settings-context` ломало ThemePicker до Task 2
- **Fix:** ThemePicker сразу на `useTheme()` + `APP_THEME_OPTIONS` + antd Button
- **Files modified:** `src/features/theme-settings/ui/ThemePicker.tsx`
- **Committed in:** `8790d8c`

---

**Total deviations:** 2 auto-fixed (1 FSD/correctness, 1 blocking compile)
**Impact on plan:** Необходимы для FSD и сборки; поведение совпадает с планом

## Issues Encountered

- `pnpm exec playwright test e2e/settings-theme.spec.ts` падает при загрузке `playwright.config.ts`: `TypeError: context.conditions?.includes is not a function` (Playwright 1.61.0 + Node v22.15.0). Тот же сбой на `--list` для `navigation.spec.ts` — не специфика нового теста. `.env.test` и `e2e/.auth/teacher1.json` на месте.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Темы готовы к ручной проверке на `/settings` и в журнале
- E2E нужно прогнать после починки Playwright CLI в окружении

## Self-Check: PASSED

- FOUND: `src/shared/lib/app-theme.ts`, `src/app/(dashboard)/settings/page.tsx`, `e2e/settings-theme.spec.ts`
- FOUND commits: `8790d8c`, `d8ae856`, `9088465`

---
*Phase: 260718-3bp-4-2*
*Completed: 2026-07-18*
