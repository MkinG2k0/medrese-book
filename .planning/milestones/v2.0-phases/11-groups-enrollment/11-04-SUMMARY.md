---
phase: 11-groups-enrollment
plan: 04
subsystem: api
tags: [prisma, group-enrollment, journal, nextjs, api-routes]

requires:
  - phase: 11-groups-enrollment
    provides: GroupEnrollment schema, enrollment actions, seed-e2e
provides:
  - Journal/API read paths через GroupEnrollment
  - authorize-api-request enrollment membership check
  - recalculateStudentStepIdx через primary enrollment (interim Phase 12)
  - Analytics/metrics read adapters без Student.groupId
affects: [12-subject-scoped-progress, 13-subject-journal]

tech-stack:
  added: []
  patterns:
    - "primary enrollment: orderBy enrolledAt asc (interim до Phase 12)"
    - "teacher student access: any enrollment group teacherId"

key-files:
  created:
    - src/shared/lib/enrollment.ts
  modified:
    - src/app/api/students/route.ts
    - src/shared/lib/authorize-api-request.ts
    - src/features/journal/actions/journal-actions.ts
    - src/shared/lib/student-progress/recalculate.ts
    - src/features/program-admin/actions/program-actions.ts
    - src/shared/lib/authorize-student.ts
    - src/shared/lib/authorize-student-access.ts
    - src/shared/lib/messaging/can-message-user.ts
    - src/features/accounting/lib/query-student-payments.ts
    - src/app/api/students/risk-flags/route.ts
    - src/app/api/step-completions/route.ts
    - src/features/student-portal/actions/student-actions.ts
    - src/shared/lib/student-metrics/load-student-metrics.ts
    - src/shared/lib/analytics-queries/level-stats.ts
    - src/shared/lib/analytics-queries/at-risk-students.ts
    - src/shared/lib/analytics-queries/top-students.ts

key-decisions:
  - "Interim primary enrollment = первая по enrolledAt asc до subject-scoped progress (Phase 12)"
  - "getTeacherGroup оставлен findFirst — tech debt Phase 13"
  - "11-06 user-admin/student-admin уже в HEAD; 11-04 дополнил journal/API/analytics слой"

patterns-established:
  - "findPrimaryEnrollment / findEnrollmentInGroup в src/shared/lib/enrollment.ts"
  - "teacherCanAccessStudent через getStudentGroupTeacherIds + substitution"

requirements-completed: [SUBJ-06]

coverage:
  - id: D1
    description: GET /api/students?groupId= возвращает учеников через GroupEnrollment join
    requirement: SUBJ-06
    verification:
      - kind: unit
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D2
    description: authorize-api-request проверяет STUDENT membership через GroupEnrollment
    requirement: SUBJ-06
    verification:
      - kind: unit
        ref: "pnpm test:unit"
        status: pass
    human_judgment: false
  - id: D3
    description: recalculateStudentStepIdx и deleteLevel работают через enrollment.levelId
    requirement: SUBJ-06
    verification:
      - kind: unit
        ref: "src/features/program-admin/actions/program-actions.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: Полный repo tsc зелёный; legacy student.groupId sweep в src/ → 0
    requirement: SUBJ-06
    verification:
      - kind: unit
        ref: "pnpm exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false
  - id: D5
    description: Journal и api-auth E2E зелёные
    requirement: SUBJ-06
    verification:
      - kind: e2e
        ref: "pnpm test:e2e e2e/journal.spec.ts e2e/api-auth.spec.ts"
        status: fail
    human_judgment: true
    rationale: Playwright не стартует — TypeError в playwright.config.ts (context.conditions?.includes); блокер среды, не кода 11-04

duration: 65min
completed: 2026-07-11
status: complete
---

# Phase 11 Plan 04: Journal/API Enrollment Adapters Summary

**Journal, API auth и analytics read-paths переведены на GroupEnrollment без Student.groupId; interim primary enrollment по enrolledAt asc**

## Performance

- **Duration:** ~65 min
- **Tasks:** 4 committed + 1 blocked (E2E env)
- **Files modified:** 18 source files + bench-db

## Accomplishments

- `/api/students`, `authorize-api-request` и `journal-actions` читают учеников группы через `group.enrollments`
- `recalculateStudentStepIdx` берёт level из первой enrollment; авто-промоут обновляет `enrollment.levelId`
- `deleteLevel` блокирует удаление по `groupEnrollment.count`
- Auth helpers, messaging, accounting, risk-flags, step-completions, student-portal, metrics и level-stats без `student.group`/`student.level`
- Полный `tsc` зелёный; `rg` legacy strings в `src/` → 0 (кроме DTO-полей и test description)
- `pnpm test:unit` — 122/122 pass

## Task Commits

1. **Task 1: Journal API и authorize-api-request** - `186011b`
2. **Task 2: recalculate.ts и deleteLevel** - `6152fd8`
3. **Task 3: Auth helpers и read-path адаптеры** - `510c281`
4. **Task 4: Полный compile gate (bench-db)** - `d570d05`
5. **Task 5: E2E journal/api-auth** — не выполнен (Playwright config error)

**Plan metadata:** (этот SUMMARY)

## Files Created/Modified

- `src/shared/lib/enrollment.ts` — хелперы primary/group enrollment (из 11-06, используется 11-04)
- `src/app/api/students/route.ts` — enrollment join для списка журнала
- `src/shared/lib/authorize-api-request.ts` — GroupEnrollment lookup для STUDENT; teacher access через enrollments
- `src/features/journal/actions/journal-actions.ts` — урок и список через enrollment в группе учителя
- `src/shared/lib/student-progress/recalculate.ts` — level из enrollment
- `src/features/program-admin/actions/program-actions.ts` — deleteLevel enrollment guard
- Остальные read-path файлы из плана (auth, messaging, analytics, portal, metrics)

## Decisions Made

- Interim «primary» enrollment = `orderBy enrolledAt asc` (Phase 12 subject-scoped progress)
- `getTeacherGroup` не менялся (`findFirst`) — Phase 13 journal group picker
- Координация с 11-06: user-admin/student-admin уже в `db6c6e0`; 11-04 закрыл journal/API/analytics gap

## Deviations from Plan

### Auto-fixed Issues

**1. Дополнительные analytics queries (at-risk-students, top-students)**
- **Found during:** Task 4 (full tsc)
- **Issue:** Файлы вне явного списка Task 3, но с `student.group` filter — ломали tsc
- **Fix:** `enrollments: { some: { group: { teacherId } } }` filter
- **Files modified:** `at-risk-students.ts`, `top-students.ts`
- **Verification:** tsc green
- **Committed in:** `510c281`

**2. prisma/bench-db.ts**
- **Found during:** Task 4
- **Issue:** Benchmark script использовал `group.students` / `student.level`
- **Fix:** enrollment-based queries
- **Committed in:** `d570d05`

**3. Unit test mocks**
- **Found during:** verification
- **Issue:** `program-actions.test` и `can-message-user.test` мокали `student.count` / `student.group`
- **Fix:** `groupEnrollment.count` / `groupEnrollment.findMany|findFirst`
- **Committed in:** `6152fd8`, `510c281`

---

**Total deviations:** 3 auto-fixed (blocking tsc/tests)
**Impact on plan:** Необходимы для compile gate; без scope creep

## Issues Encountered

- **E2E blocked:** `pnpm test:e2e e2e/journal.spec.ts e2e/api-auth.spec.ts` падает при загрузке `playwright.config.ts` (`context.conditions?.includes is not a function`) — инфраструктурный блокер, не регрессия 11-04
- **11-06 parallel:** user-admin/student-admin уже закоммичены параллельным executor (`db6c6e0`); Task 4 tsc прошёл без дополнительных правок user-admin

## User Setup Required

None

## Next Phase Readiness

- Journal/API layer готов для Phase 12 (subject-scoped progress) и Phase 13 (journal group/subject picker)
- E2E journal/api-auth требует починки Playwright config или ручного smoke GET `/api/students?groupId=`

---
*Phase: 11-groups-enrollment*
*Completed: 2026-07-11*
