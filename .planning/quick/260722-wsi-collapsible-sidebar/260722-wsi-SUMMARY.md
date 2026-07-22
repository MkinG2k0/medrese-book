---
phase: 260722-wsi-collapsible-sidebar
plan: 01
subsystem: ui
tags: [antd, sider, localStorage, app-shell, layout]

requires: []
provides:
  - "Desktop sidebar collapse toggle in Header"
  - "localStorage persistence for collapsed preference"
affects: [app-shell, dashboard-layout]

tech-stack:
  added: []
  patterns:
    - "widgets/*/lib/*-storage.ts for SSR-safe localStorage preferences"
    - "Hydrate UI preference in useEffect after mount to avoid SSR mismatch"

key-files:
  created:
    - src/widgets/app-shell/lib/sidebar-storage.ts
  modified:
    - src/widgets/app-shell/ui/AppShell.tsx

key-decisions:
  - "Persist collapsed as \"1\"/\"0\" strings under app-shell:sidebar-collapsed"
  - "Custom Header toggle with trigger={null}; mobile Drawer unchanged"

patterns-established:
  - "App-shell preference storage mirrors journal-storage (window guard + try/catch)"

requirements-completed:
  - QUICK-collapsible-sidebar

coverage:
  - id: D1
    description: "Десктопный сайдбар сворачивается/разворачивается кнопкой в Header"
    requirement: QUICK-collapsible-sidebar
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: true
    rationale: "Визуальное поведение Sider/кнопки требует ручной проверки в браузере"
  - id: D2
    description: "Состояние collapsed/expanded сохраняется в localStorage и восстанавливается после reload"
    requirement: QUICK-collapsible-sidebar
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: true
    rationale: "Persist/hydrate через localStorage проверяется reload в браузере"
  - id: D3
    description: "Mobile Drawer не затронут persistence; бургер работает как раньше"
    requirement: QUICK-collapsible-sidebar
    verification: []
    human_judgment: true
    rationale: "Mobile UX проверяется на узком viewport"

duration: 5min
completed: 2026-07-22
status: complete
---

# Phase 260722-wsi: Collapsible Sidebar Summary

**Десктопный Sider сворачивается кнопкой в Header; preference collapsed/expanded пишется в localStorage и поднимается после mount без SSR mismatch.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-22T20:39:50Z
- **Completed:** 2026-07-22T20:45:00Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments
- Добавлен `sidebar-storage.ts` с ключом `app-shell:sidebar-collapsed` и API read/write (`"1"`/`"0"`)
- В `AppShell` — hydrate после mount, единый `handleCollapse`, видимый fold/unfold в Header на десктопе
- Mobile Drawer и `trigger={null}` на Sider сохранены без изменений scope

## Task Commits

Each task was committed atomically:

1. **Task 1: Sidebar collapsed localStorage helper** - `710bbd1` (feat)
2. **Task 2: Visible toggle + persist/hydrate in AppShell** - `dd55efa` (feat)

**Plan metadata:** skipped (orchestrator commits docs)

## Files Created/Modified
- `src/widgets/app-shell/lib/sidebar-storage.ts` — SSR-safe localStorage helper for collapsed flag
- `src/widgets/app-shell/ui/AppShell.tsx` — desktop toggle, hydrate, persist via `handleCollapse`

## Decisions Made
- Формат storage: `"1"` / `"0"` (компактно, однозначно)
- Чтение только в `useEffect`, не в `useState` initializer — избегаем hydration mismatch
- Persistence только для десктопного `collapsed`; `drawerOpen` не пишется

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Quick task complete. Smoke: свернуть → reload → остаётся свёрнутым; развернуть → reload → развёрнут; мобилка — бургер/Drawer без регрессий.

---
*Phase: 260722-wsi-collapsible-sidebar*
*Completed: 2026-07-22*

## Self-Check: PASSED

- FOUND: `src/widgets/app-shell/lib/sidebar-storage.ts`
- FOUND: `src/widgets/app-shell/ui/AppShell.tsx`
- FOUND: `.planning/quick/260722-wsi-collapsible-sidebar/260722-wsi-SUMMARY.md`
- FOUND commits: `710bbd1`, `dd55efa`
