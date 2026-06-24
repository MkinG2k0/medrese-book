---
phase: 00-foundation
plan: 01
subsystem: testing
tags: [vitest, playwright, e2e, nyquist, foundation]

requires: []
provides:
  - vitest config and test:unit script for analytics filter unit tests
  - Playwright API auth helpers (apiGetAs, expectForbidden)
  - RED E2E specs for FND-02/03/04
affects: [00-foundation-02, 00-foundation-03, 00-foundation-04, 00-foundation-05]

tech-stack:
  added: [vitest 4.1.9]
  patterns:
    - "Nyquist RED tests before implementation (Wave 0)"
    - "next-auth CSRF login for APIRequestContext in e2e"
    - "read-only pg Pool in e2e/helpers/db.ts"

key-files:
  created:
    - vitest.config.ts
    - src/shared/lib/analytics-queries/filters.test.ts
    - e2e/helpers/api.ts
    - e2e/helpers/db.ts
    - e2e/api-auth.spec.ts
    - e2e/student-progress.spec.ts
    - e2e/domain-events.spec.ts
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "e2e/helpers/db.ts uses pg Pool instead of Prisma client to avoid ESM import.meta errors in Playwright test runner"
  - "countAuditEvents returns 0 when AuditEvent table missing — keeps domain-events.spec RED until plan 05"

patterns-established:
  - "Unit filter tests in src/shared/lib/analytics-queries/ via vitest"
  - "API role tests via e2e/helpers/api.ts + TEST_CODES"

requirements-completed: []

duration: 12min
completed: 2026-06-24
---

# Phase 0 Plan 01: Test Infrastructure Summary

**Vitest RED unit tests for analytics filters plus Playwright API scaffolding with role-based auth helpers and failing E2E specs for FND-02/03/04**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-24T16:00:00Z
- **Completed:** 2026-06-24T16:12:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Vitest настроен с alias `@` и скриптом `pnpm test:unit`; `filters.test.ts` падает (нет `filters.ts`)
- E2E-хелперы `apiGetAs` / `apiPostAs` / `expectForbidden` / `expectUnauthorized` через next-auth CSRF flow
- Три spec-файла зарегистрированы в Playwright: api-auth (3 теста), student-progress, domain-events

## Task Commits

Each task was committed atomically:

1. **Task 1: Vitest и npm-скрипт для unit-тестов фильтров** - `cf7c827` (feat)
2. **Task 2: E2E API-хелперы** - `3717ab7` (feat)
3. **Task 3: Stub E2E specs (RED) для FND-02/03/04** - `7294696` (test)

## Files Created/Modified

- `vitest.config.ts` — vitest config с `@` → `./src`
- `src/shared/lib/analytics-queries/filters.test.ts` — 4 RED-теста для фильтров (plan 02)
- `e2e/helpers/api.ts` — authenticated API requests по TEST_CODES
- `e2e/helpers/db.ts` — read-only pg queries для group/student IDs и AuditEvent count
- `e2e/api-auth.spec.ts` — матрица 401 / cross-group / sessions
- `e2e/student-progress.spec.ts` — sync journal vs student portal
- `e2e/domain-events.spec.ts` — AuditEvent после updateStudentProgress
- `package.json` — vitest + `test:unit` script

## Decisions Made

- Использовать `pg.Pool` в e2e db helper вместо Prisma client — Playwright не загружает generated ESM client
- AuditEvent count через raw SQL с catch → 0 до миграции plan 05

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] e2e/helpers/db.ts uses pg instead of Prisma client**
- **Found during:** Task 3 (Stub E2E specs)
- **Issue:** Import `@/shared/lib/create-prisma-client` caused `SyntaxError: Cannot use 'import.meta' outside a module` in Playwright test listing
- **Fix:** Rewrote db helper with read-only `pg.Pool` queries against `.env.test` DATABASE_URL
- **Files modified:** e2e/helpers/db.ts
- **Verification:** `pnpm exec playwright test e2e/api-auth.spec.ts --list` lists 3 tests
- **Committed in:** 7294696

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for Playwright spec registration; aligns with threat model T-0-02 (read-only DB access)

## Issues Encountered

None beyond Prisma ESM loading in Playwright (resolved via deviation above).

## User Setup Required

None — uses existing `.env.test` and seed data.

## Next Phase Readiness

- Plan 02 can implement `filters.ts` to turn unit tests GREEN
- Plan 03 can wire `authorizeApiRequest` to turn api-auth.spec GREEN
- Plan 04/05 for student-progress and domain-events respectively

## Self-Check: PASSED

- FOUND: vitest.config.ts
- FOUND: e2e/helpers/api.ts
- FOUND: e2e/api-auth.spec.ts
- FOUND: cf7c827, 3717ab7, 7294696

---
*Phase: 00-foundation*
*Completed: 2026-06-24*
