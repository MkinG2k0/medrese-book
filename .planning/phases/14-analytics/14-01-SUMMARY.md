---
phase: 14-analytics
plan: 01
subsystem: ui
tags: [analytics, subject-filter, nextjs, ant-design, vitest, prisma]

requires:
  - phase: 10-subject-foundation
    provides: Subject model, DEFAULT_QURAN_SUBJECT_ID, Group.subjectId
  - phase: 13-journal
    provides: URL query + localStorage pattern from journal-storage
provides:
  - AnalyticsSubjectPicker in analytics header
  - subjectId in URL query params (ANALYTICS_SUBJECT_PARAM)
  - resolveAnalyticsSubjectFilter with role-scoped validation
  - getAnalyticsSubjects server action with teacher/manager scoping
  - Subject-scoped group filtering on analytics page
  - Placeholder gate blocking mixed-subject metrics until 14-02
affects:
  - 14-02-analytics metrics wiring
  - StudentStudyHistoryModal subject scope

tech-stack:
  added: []
  patterns:
    - "Subject filter in URL via buildAnalyticsSearchParams + resolveAnalyticsSubjectFilter"
    - "localStorage fallback via analytics-storage.ts (ANALYTICS_SUBJECT_STORAGE_KEY)"
    - "Role-scoped getAnalyticsSubjects separate from subject-admin getSubjects"

key-files:
  created:
    - src/features/analytics/lib/analytics-storage.ts
    - src/features/analytics/ui/AnalyticsSubjectPicker.tsx
  modified:
    - src/features/analytics/lib/analytics-query.ts
    - src/features/analytics/lib/analytics-query.test.ts
    - src/features/analytics/actions/analytics-actions.ts
    - src/app/(dashboard)/analytics/page.tsx
    - src/features/analytics/ui/AnalyticsTeacherPicker.tsx
    - src/features/analytics/ui/AnalyticsGroupPicker.tsx
    - src/features/analytics/ui/AnalyticsMonthPicker.tsx

key-decisions:
  - "Default subject: DEFAULT_QURAN_SUBJECT_ID when in validSubjectIds, else first sorted id"
  - "Subject change resets groupId to ALL_GROUPS (D-09)"
  - "Metrics placeholder via Ant Design Empty until plan 14-02 wires subject-scoped queries"
  - "getAnalyticsSubjects separate from getSubjects to allow TEACHER role access"

patterns-established:
  - "All analytics pickers propagate subjectId on navigation via buildAnalyticsSearchParams"
  - "teacherGroups filtered server-side by group.subjectId === filterSubjectId before group picker"

requirements-completed: [SUBJ-14]

coverage:
  - id: D1
    description: "subjectId in URL query via buildAnalyticsSearchParams and ANALYTICS_SUBJECT_PARAM"
    requirement: SUBJ-14
    verification:
      - kind: unit
        ref: "src/features/analytics/lib/analytics-query.test.ts#buildAnalyticsSearchParams"
        status: pass
    human_judgment: false
  - id: D2
    description: "resolveAnalyticsSubjectFilter validates against role-scoped list with DEFAULT_QURAN fallback"
    requirement: SUBJ-14
    verification:
      - kind: unit
        ref: "src/features/analytics/lib/analytics-query.test.ts#resolveAnalyticsSubjectFilter"
        status: pass
    human_judgment: false
  - id: D3
    description: "getAnalyticsSubjects returns role-scoped subject list"
    requirement: SUBJ-14
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D4
    description: "AnalyticsSubjectPicker visible in header; subject change resets groupId"
    requirement: SUBJ-14
    verification: []
    human_judgment: true
    rationale: "UI placement and group reset on subject change require manual browser verification"
  - id: D5
    description: "Analytics page does not load mixed-subject metrics (placeholder gate)"
    requirement: SUBJ-14
    verification:
      - kind: other
        ref: "rg getTopStudents|getLevelStats|getAtRiskStudents src/app/(dashboard)/analytics/page.tsx (no matches)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-07-12
status: complete
---

# Phase 14 Plan 01: Subject Filter Foundation Summary

**Subject picker on /analytics with URL-scoped subjectId, role-filtered subject list, and placeholder gate blocking mixed-subject metrics until 14-02**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-11T22:12:00Z
- **Completed:** 2026-07-11T22:16:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Добавлен селект предмета в шапку `/analytics` с сохранением `subjectId` в URL
- `resolveAnalyticsSubjectFilter` валидирует subjectId против role-scoped списка с дефолтом DEFAULT_QURAN
- `getAnalyticsSubjects` возвращает все предметы для менеджера/супер-админа и только предметы групп учителя для TEACHER
- Группы в picker отфильтрованы по выбранному предмету; смена предмета сбрасывает groupId
- Метрики заменены placeholder (Empty) — смешанные данные не загружаются до плана 14-02

## Task Commits

Each task was committed atomically:

1. **Task 1: URL/query helpers и resolveAnalyticsSubjectFilter** - `5e27c18` (feat)
2. **Task 2: getAnalyticsSubjects и AnalyticsSubjectPicker** - `c692af9` (feat)
3. **Task 3: Интеграция page.tsx и синхронизация pickers** - `4c20ff6` (feat)

## Files Created/Modified
- `src/features/analytics/lib/analytics-query.ts` — ANALYTICS_SUBJECT_PARAM, resolveAnalyticsSubjectFilter, subjectId в buildAnalyticsSearchParams
- `src/features/analytics/lib/analytics-storage.ts` — localStorage helpers для последнего предмета
- `src/features/analytics/lib/analytics-query.test.ts` — 14 unit-тестов для subject filter и search params
- `src/features/analytics/actions/analytics-actions.ts` — getAnalyticsSubjects, subjectId в AnalyticsGroupOption
- `src/features/analytics/ui/AnalyticsSubjectPicker.tsx` — UI-селект предмета
- `src/app/(dashboard)/analytics/page.tsx` — интеграция subject scope, placeholder вместо метрик
- `src/features/analytics/ui/Analytics*Picker.tsx` — все pickers прокидывают subjectId

## Decisions Made
- Дефолтный предмет: DEFAULT_QURAN_SUBJECT_ID если в списке, иначе первый отсортированный id
- При смене предмета groupId сбрасывается до ALL_GROUPS (D-09)
- Метрики отложены до 14-02 — placeholder Empty вместо Promise.all с query-функциями
- getAnalyticsSubjects отдельно от getSubjects для доступа учителя

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 14-02 может подключить getTopStudents/getLevelStats/getAtRiskStudents с subjectId
- StudentStudyHistoryModal subject scope — отдельная задача в 14-02/14-03
- Ручная проверка: /analytics?subjectId=... сохраняет предмет после F5; смена предмета сбрасывает группу

## Self-Check: PASSED
- FOUND: src/features/analytics/lib/analytics-storage.ts
- FOUND: src/features/analytics/ui/AnalyticsSubjectPicker.tsx
- FOUND: src/features/analytics/lib/analytics-query.ts
- FOUND: commit 5e27c18
- FOUND: commit c692af9
- FOUND: commit 4c20ff6

---
*Phase: 14-analytics*
*Completed: 2026-07-12*
