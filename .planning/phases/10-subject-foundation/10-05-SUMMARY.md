---
phase: 10-subject-foundation
plan: 05
subsystem: database
tags: [prisma, seed, subject, postgres]

requires:
  - phase: 10-subject-foundation
    provides: Subject model, Level.subjectId, DEFAULT_QURAN_SUBJECT_ID
provides:
  - Parameterized seedProgram(prisma, { subjectId })
  - seedMiniProgram for compact demo programs
  - Three-subject demo seed (Коран, Таджвид, Арабский язык)
  - CLI seed-program and seed-prod aligned with subjectId
affects:
  - 10-subject-foundation follow-on plans
  - e2e seed scripts

tech-stack:
  added: []
  patterns:
    - "seedProgram requires subjectId; levels scoped per subject via findFirst(subjectId, number)"
    - "Demo students always on Quran subject levels"

key-files:
  created: []
  modified:
    - prisma/lib/seed-program.ts
    - prisma/seed.ts
    - prisma/seed-program.ts
    - prisma/seed-prod.ts
    - prisma/seed-e2e.ts

key-decisions:
  - "subject.deleteMany after level.deleteMany — FK Restrict on Level.subjectId"
  - "Quran subject uses DEFAULT_QURAN_SUBJECT_ID in demo seed for migration alignment"
  - "db:seed is canonical multi-subject verification; db:seed:program upserts Quran subject for standalone import"

patterns-established:
  - "Full JSON program import only for Quran via seedProgram"
  - "Tajweed/Arabic use seedMiniProgram with inline StepDef arrays"

requirements-completed: [SUBJ-18]

coverage:
  - id: D1
    description: "seedProgram and level creates require subjectId"
    requirement: SUBJ-18
    verification:
      - kind: other
        ref: "pnpm exec tsc --noEmit -p tsconfig.json (lib/seed-program)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Demo seed creates Коран, Таджвид, Арабский язык with distinct programs"
    requirement: SUBJ-18
    verification:
      - kind: other
        ref: "pnpm db:seed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Students remain on Quran levels only"
    requirement: SUBJ-18
    verification:
      - kind: other
        ref: "prisma/seed.ts quranLevels query + student levelId assignment"
        status: pass
    human_judgment: false
  - id: D4
    description: "Standalone db:seed:program works with Quran subjectId"
    requirement: SUBJ-18
    verification:
      - kind: other
        ref: "prisma/seed-program.ts ensureQuranSubject + seedProgram"
        status: pass
    human_judgment: true
    rationale: "CLI idempotent import on non-empty DB not re-run in this session"

duration: 35min
completed: 2026-07-07
status: complete
---

# Phase 10 Plan 05: Multi-Subject Seed Summary

**Параметризованный seed с тремя предметами: полная программа Корана, компактные программы Таджвида и арабского; ученики остаются на уровнях Корана.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-07T17:58:00Z
- **Completed:** 2026-07-07T18:33:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `seedProgram(prisma, { subjectId })` и `seedMiniProgram` — все `level.create` с `subjectId`
- Демо-seed: Коран (5 уровней, JSON), Таджвид (2×3 шага), Арабский (3×5 шагов)
- Ученики и offsets привязаны только к уровням предмета «Коран»
- `pnpm db:seed:program` и `seed-prod` создают/upsert предмет Коран перед импортом

## Task Commits

1. **Task 1: Parameterize seed-program for subjectId** - `a069eba` (feat)
2. **Task 2: Three-subject demo seed in seed.ts** - `48f5af4` (feat)
3. **Task 3: Verify seed-program standalone script** - `315c43a` (feat)

## Files Created/Modified

- `prisma/lib/seed-program.ts` — subjectId на всех уровнях, `seedMiniProgram`, composite lookup
- `prisma/seed.ts` — три предмета, wipe subjects после levels, лог сводки
- `prisma/seed-program.ts` — CLI upsert Коран + `seedProgram({ subjectId })`
- `prisma/seed-prod.ts` — ensureQuranSubject перед программой
- `prisma/seed-e2e.ts` — subjectId на уровнях E2E (см. deviations)

## Decisions Made

- Удаление `subject` только после `level` из-за `onDelete: Restrict`
- `DEFAULT_QURAN_SUBJECT_ID` в demo-seed для согласованности с миграцией backfill
- `db:seed` — каноническая проверка multi-subject; standalone `db:seed:program` — только Коран

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] subject.deleteMany после level.deleteMany**
- **Found during:** Task 2
- **Issue:** План указывал `subject.deleteMany` перед `level.deleteMany`, что нарушает FK Restrict
- **Fix:** `level.deleteMany()` затем `subject.deleteMany()`
- **Files modified:** `prisma/seed.ts`
- **Committed in:** `48f5af4`

**2. [Rule 3 - Blocking] Миграция add_subject не была применена на БД**
- **Found during:** Task 2 (`pnpm db:seed`)
- **Issue:** Таблица `Subject` отсутствовала
- **Fix:** `pnpm db:migrate:deploy` перед повторным seed
- **Verification:** `pnpm db:seed` успешно
- **Committed in:** N/A (операция БД)

**3. [Rule 3 - Blocking] seed-prod и seed-e2e без subjectId**
- **Found during:** Task 3 / tsc
- **Issue:** Сигнатура `seedProgram` требует `subjectId`; e2e `level.create` без поля
- **Fix:** `ensureQuranSubject` в seed-prod/seed-program; subject + subjectId в seed-e2e
- **Files modified:** `prisma/seed-prod.ts`, `prisma/seed-e2e.ts`
- **Committed in:** `315c43a`

---

**Total deviations:** 3 auto-fixed (1 Rule 2, 2 Rule 3)
**Impact on plan:** Все правки необходимы для корректности FK и сборки. Объём минимальный.

## Issues Encountered

- Первая попытка `db:seed` упала до применения миграции `20260707180000_add_subject` — исправлено deploy.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Демо-данные демонстрируют multi-subject модель (SUBJ-18)
- Готово для UI/CRUD предметов в следующих планах фазы 10
- `seed-e2e.ts` обновлён; при изменении e2e-сценариев проверять `pnpm db:seed:e2e`

## Self-Check: PASSED

- FOUND: `.planning/phases/10-subject-foundation/10-05-SUMMARY.md`
- FOUND: `prisma/lib/seed-program.ts`
- FOUND: commit `a069eba`
- FOUND: commit `48f5af4`
- FOUND: commit `315c43a`

---
*Phase: 10-subject-foundation*
*Completed: 2026-07-07*
