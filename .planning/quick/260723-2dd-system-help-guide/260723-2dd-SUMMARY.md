---
phase: 260723-2dd-system-help-guide
plan: 01
subsystem: ui
tags: [help, antd, fsd, e2e, acl]

requires: []
provides:
  - "Страница /help с русской справкой для TEACHER/MANAGER/SUPER_ADMIN"
  - "FSD feature src/features/help/ (контент + UI)"
  - "SVG-заглушки скриншотов в public/help/ со стабильными именами"
  - "Пункт меню «Справка» и ROLE_ROUTES ACL"
  - "e2e/help.spec.ts smoke по ролям"
affects: []

tech-stack:
  added: []
  patterns:
    - "Help content as typed TS constants (teacher/manager guides)"
    - "Role-aware HelpGuide: teacher-only vs Tabs for manager/super-admin"
    - "SVG placeholders under /help/<stable-name>.svg"

key-files:
  created:
    - public/help/*.svg
    - src/features/help/model/types.ts
    - src/features/help/model/teacher-guide.ts
    - src/features/help/model/manager-guide.ts
    - src/features/help/ui/HelpScreenshot.tsx
    - src/features/help/ui/HelpGuide.tsx
    - src/features/help/index.ts
    - src/app/(dashboard)/help/page.tsx
    - e2e/help.spec.ts
  modified:
    - src/shared/lib/match-role-route.ts
    - src/shared/lib/match-role-route.test.ts
    - src/widgets/app-shell/ui/AppShell.tsx

key-decisions:
  - "Collapse для каталога фич; Tabs только для переключения Менеджер/Учитель у MANAGER и SUPER_ADMIN"
  - "img вместо next/image для SVG-заглушек (без dangerouslyAllowSVG)"
  - "/help перед /settings в MENU_ORDER_BY_ROLE для TEACHER и managerMenuOrder"

patterns-established:
  - "Thin help page: requireRoles + Title + HelpGuide(role)"
  - "Screenshot placeholders: stable public/help/*.svg filenames"

requirements-completed:
  - QUICK-system-help-guide

coverage:
  - id: D1
    description: "Учитель открывает /help и видит русскую справку с обзором"
    requirement: QUICK-system-help-guide
    verification:
      - kind: e2e
        ref: "e2e/help.spec.ts#учитель открывает /help и видит пункт меню"
        status: unknown
    human_judgment: false
  - id: D2
    description: "Менеджер видит вкладки Менеджер/Учитель на /help"
    requirement: QUICK-system-help-guide
    verification:
      - kind: e2e
        ref: "e2e/help.spec.ts#менеджер открывает /help"
        status: unknown
    human_judgment: false
  - id: D3
    description: "STUDENT не остаётся на /help (ACL deny)"
    requirement: QUICK-system-help-guide
    verification:
      - kind: unit
        ref: "src/shared/lib/match-role-route.test.ts#STUDENT на /help → deny"
        status: pass
      - kind: e2e
        ref: "e2e/help.spec.ts#ученик не остаётся на /help"
        status: unknown
    human_judgment: false
  - id: D4
    description: "Пункт «Справка» в сайдбаре перед Настройками"
    requirement: QUICK-system-help-guide
    verification:
      - kind: e2e
        ref: "e2e/help.spec.ts#menuitem Справка"
        status: unknown
    human_judgment: true
    rationale: "Порядок пунктов меню относительно Настроек удобнее подтвердить визуально"

duration: 8min
completed: 2026-07-23
status: complete
---

# Phase 260723-2dd Plan 01: System Help Guide Summary

**Русская страница `/help` с обзором, каталогом фич меню и пошаговыми сценариями; ACL и пункт сайдбара для учителя/менеджера/супер-админа.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-22T22:45:40Z
- **Completed:** 2026-07-22T22:50:00Z
- **Tasks:** 3/3
- **Files modified:** 18

## Accomplishments

- Типизированные гайды учителя и менеджера (обзор, все пункты меню D-06, ≥2 walkthroughs)
- UI `HelpGuide` / `HelpScreenshot` на Ant Design (Tabs, Collapse, Steps) без Flex и static message/Modal
- Маршрут `/help` с `requireRoles` + `ROLE_ROUTES`; пункт «Справка» с `QuestionCircleOutlined` перед «Настройки»
- 7 SVG-заглушек в `public/help/` со стабильными именами; smoke e2e по ролям

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `632248a` | Help content data and screenshot placeholders |
| 2 | `e12f575` | HelpGuide UI and feature barrel |
| 3 | `3af4e93` | Page, ACL, nav, and e2e smoke |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `public/help/*.svg` | Placeholder wireframe images labeled «Скриншот: …» | Per D-05 — replace with real PNG later without renaming paths |

## Threat Flags

None — no new trust-boundary surface beyond planned ROLE_ROUTES `/help` allowlist.

## Self-Check: PASSED

- All key artifacts present on disk
- Commits `632248a`, `e12f575`, `3af4e93` present in git log
- `vitest run src/shared/lib/match-role-route.test.ts` — 17 passed
- `tsc --noEmit` — clean after each task
