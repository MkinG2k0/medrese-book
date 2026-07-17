---
phase: 260718-2kp-remove-teacher-description
plan: 01
subsystem: ui
tags: [journal, program-admin, zod, step, teacherNote]

requires: []
provides:
  - "StepForm без plain-text description; только teacherNote"
  - "StepCard без Collapse описания; teacherNote сохранён"
  - "createStepSchema без поля description"
affects: [program-admin, journal]

tech-stack:
  added: []
  patterns:
    - "Step.description остаётся в Prisma/БД, но не в UI/Zod payload"

key-files:
  created: []
  modified:
    - src/features/program-admin/ui/StepForm.tsx
    - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
    - src/shared/lib/validations/step.ts
    - src/features/journal/ui/StepCard.tsx
    - src/features/journal/lib/journal-step.ts
    - src/features/journal/actions/journal-actions.ts
    - src/features/journal/actions/journal-actions.test.ts

key-decisions:
  - "Колонку Step.description не дропаем — только UI и Zod"
  - "teacherNote / «Заметка учителя» без изменений"

patterns-established:
  - "Plain-text Step.description — legacy DB-only; методические подсказки только через teacherNote"

requirements-completed:
  - QUICK-remove-teacher-description

coverage:
  - id: D1
    description: "Форма шага без plain-text описания; teacherNote на месте"
    requirement: QUICK-remove-teacher-description
    verification:
      - kind: other
        ref: "rg description StepForm.tsx (0 matches); teacherNote label present"
        status: pass
    human_judgment: false
  - id: D2
    description: "Журнал без Collapse description; teacherNote Collapse сохранён"
    requirement: QUICK-remove-teacher-description
    verification:
      - kind: unit
        ref: "src/features/journal/actions/journal-actions.test.ts"
        status: pass
      - kind: other
        ref: "rg teacher-description|step.description StepCard (0 matches)"
        status: pass
    human_judgment: false
  - id: D3
    description: "create/update шага не принимают description; Prisma column intact"
    requirement: QUICK-remove-teacher-description
    verification:
      - kind: other
        ref: "createStepSchema без description; prisma Step.description @default(\"\")"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-07-18
status: complete
---

# Phase 260718-2kp: Remove Teacher Description Summary

**Убрано plain-text поле `Step.description` из формы программы и журнала; rich-text `teacherNote` и колонка БД сохранены**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-17T22:53:19Z
- **Completed:** 2026-07-17T22:54:34Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- StepForm больше не показывает и не отправляет plain-text «Описание для учителя»
- StepCard больше не рендерит Collapse с `step.description`; блок «Заметка учителя» остался
- Zod `createStepSchema` / `updateStepSchema` не принимают `description`
- Колонка `Step.description` в Prisma не тронута

## Task Commits

1. **Task 1: Убрать description из формы шага и Zod** - `650daae` (fix)
2. **Task 2: Убрать description из журнала и маппинга шагов** - `245a869` (fix)

**Plan metadata:** skipped (orchestrator commits docs in Step 8)

## Files Created/Modified

- `src/features/program-admin/ui/StepForm.tsx` — удалены state/UI/payload description
- `src/app/(dashboard)/admin/subjects/.../edit/page.tsx` — не передаёт description в initial
- `src/shared/lib/validations/step.ts` — description убран из createStepSchema
- `src/features/journal/ui/StepCard.tsx` — убран Collapse teacher-description
- `src/features/journal/lib/journal-step.ts` — JournalStepMeta/mapStepMeta без description
- `src/features/journal/actions/journal-actions.ts` — select без description
- `src/features/journal/actions/journal-actions.test.ts` — фикстуры без description

## Decisions Made

- Не дропать колонку БД и не делать миграцию — данные остаются для безопасности
- Не трогать `program-actions.ts` — после удаления из Zod поле просто не приходит

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Quick task complete. Готово к следующему quick/milestone.

## Self-Check: PASSED

- FOUND: StepForm.tsx, StepCard.tsx, journal-step.ts, step.ts validations
- FOUND: commits 650daae, 245a869
- FOUND: teacherNote intact in StepForm and StepCard
- FOUND: Step.description still in prisma/schema.prisma
- PASSED: vitest journal-actions.test.ts (4 tests)

---
*Phase: 260718-2kp-remove-teacher-description*
*Completed: 2026-07-18*
