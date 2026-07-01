---
phase: 01-student-analytics-history
plan: 05
subsystem: testing
tags: [playwright, vitest, e2e, analytics, at-risk, auth]

requires:
  - phase: 01-student-analytics-history
    provides: UI and API from plans 01-01…01-04 (timer, metrics, at-risk, history modal)
provides:
  - E2E smoke coverage for teacher timer, analytics drill-down, student portal metrics
  - Unit auth gate for GET /api/at-risk-students
affects: []

tech-stack:
  added: []
  patterns:
    - E2E uses teacher2 for journal timer to avoid conflicting with journal.spec.ts on teacher1
    - At-risk history test falls back to TopStudents when at-risk table is empty
    - Route test uses dynamic import and module mocks to avoid next-auth in vitest

key-files:
  created:
    - e2e/student-analytics.spec.ts
    - src/app/api/at-risk-students/route.test.ts
  modified:
    - e2e/helpers/codes.ts

key-decisions:
  - "Journal timer E2E on teacher2 (group Ан-Нас) to isolate from journal.spec.ts lifecycle"
  - "Route unit test mocks authorizeApiRequest/analytics/prisma with dynamic GET import"

patterns-established:
  - "student-analytics.spec.ts split by role: teacher timer+analytics, student portal"
  - "Vitest route tests avoid top-level route import to prevent next-auth module load"

requirements-completed: [ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-08, ANLY-09, ANLY-10]

coverage:
  - id: D1
    description: "E2E teacher timer start → duration → unlocked journal → end lesson"
    requirement: ANLY-01
    verification:
      - kind: e2e
        ref: "e2e/student-analytics.spec.ts#таймер урока"
        status: unknown
    human_judgment: true
    rationale: "Playwright не запускается в текущей среде (dotenv + Playwright loader); требуется CI или локальный прогон"
  - id: D2
    description: "E2E at-risk / TopStudents opens history modal with duration column"
    requirement: ANLY-09
    verification:
      - kind: e2e
        ref: "e2e/student-analytics.spec.ts#at-risk или топ учеников"
        status: unknown
    human_judgment: true
    rationale: "E2E runner blocked in executor environment"
  - id: D3
    description: "E2E student portal metrics without at-risk heading"
    requirement: ANLY-07
    verification:
      - kind: e2e
        ref: "e2e/student-analytics.spec.ts#портал показывает метрики"
        status: unknown
    human_judgment: true
    rationale: "E2E runner blocked in executor environment"
  - id: D4
    description: "Unit STUDENT forbidden on /api/at-risk-students"
    requirement: ANLY-08
    verification:
      - kind: unit
        ref: "src/app/api/at-risk-students/route.test.ts#returns 403 when caller is STUDENT"
        status: pass
    human_judgment: false
  - id: D5
    description: "Unit TEACHER receives at-risk data from getAtRiskStudents"
    requirement: ANLY-08
    verification:
      - kind: unit
        ref: "src/app/api/at-risk-students/route.test.ts#returns at-risk data for TEACHER"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-01
status: complete
---

# Phase 01 Plan 05: Automated Tests Summary

**Playwright smoke для таймера, at-risk drill-down и портала ученика; Vitest auth gate для at-risk API**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-01T19:35:00Z
- **Completed:** 2026-07-01T19:55:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `e2e/student-analytics.spec.ts` — teacher timer cycle, analytics history modal с «Длительность занятия», student portal metrics
- `route.test.ts` — STUDENT → 403, TEACHER → getAtRiskStudents
- `TEST_USERS` дополнен именами Халид/Зайд для teacher2 journal

## Task Commits

Each task was committed atomically:

1. **Task 1: E2E student-analytics.spec.ts** - `e14b596` (test)
2. **Task 2: API auth test и регрессия unit** - `2a81e2b` (test)

## Files Created/Modified

- `e2e/student-analytics.spec.ts` — Playwright smoke Phase 1 analytics
- `e2e/helpers/codes.ts` — studentKhalid, studentZayd в TEST_USERS
- `src/app/api/at-risk-students/route.test.ts` — auth gate unit tests

## Decisions Made

- Timer E2E на teacher2, чтобы не завершать урок teacher1 и не ломать journal.spec.ts
- При пустой at-risk таблице клик по TopStudents (Али) как fallback для ANLY-09

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest route test mock strategy**
- **Found during:** Task 2
- **Issue:** Прямой import route.ts тянул next-auth → `context.conditions?.includes is not a function`
- **Fix:** Полные vi.mock фабрики + dynamic import GET в тестах
- **Files modified:** `src/app/api/at-risk-students/route.test.ts`
- **Verification:** `pnpm test:unit -- src/app/api/at-risk-students/route.test.ts` — 2 passed
- **Committed in:** `2a81e2b`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Минимальное изменение стратегии теста; поведение проверки не изменилось.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth | src/app/api/at-risk-students/route.test.ts | Mitigates T-01-12: STUDENT forbidden verified |

## Issues Encountered

- `pnpm test:e2e` не запускается в среде исполнителя: `TypeError: context.conditions?.includes is not a function` при загрузке `playwright.config.ts` (dotenv import). Проблема воспроизводится на всех e2e spec, не связана с новым файлом. Unit-тесты проходят (25/25 в наборе плана).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Фаза 01 student-analytics-history завершена (5/5 планов)
- E2E spec готов для CI; локальный прогон: `pnpm test:e2e -- e2e/student-analytics.spec.ts`

## Self-Check: PASSED

- FOUND: e2e/student-analytics.spec.ts
- FOUND: src/app/api/at-risk-students/route.test.ts
- FOUND: e14b596
- FOUND: 2a81e2b

---
*Phase: 01-student-analytics-history*
*Completed: 2026-07-01*
