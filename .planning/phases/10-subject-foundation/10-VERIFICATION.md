---
phase: 10-subject-foundation
verified: 2026-07-07T18:39:00Z
status: human_needed
score: 13/14 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Редактор шагов с Tiptap работает в контексте предмета"
    test: "Войти как менеджер → /admin/subjects → программа предмета → уровень → «Новый шаг» или редактирование шага; ввести текст, арабский блок, изображение; сохранить и перезагрузить страницу"
    expected: "Контент сохраняется в Step.content (JSON blocks), редактор Tiptap отображает сохранённое; редирект на programLevelPath после сохранения"
    why_human: "StepEditor подключён через StepForm, но нет E2E/интеграционного теста, подтверждающего runtime-сохранение Tiptap-контента в subject-scoped маршруте"
human_verification:
  - test: "Полный сценарий менеджера: создать предмет → открыть программу → создать уровень (модал) → создать шаг с Tiptap → вернуться к списку шагов"
    expected: "Все переходы по /admin/subjects/[subjectId]/program/** работают; breadcrumbs корректны; глобальный номер шага в скобках отображается per-subject"
    why_human: "UI-модалки, breadcrumbs и навигация не покрыты E2E; unit-тесты проверяют только server actions"
  - test: "Удаление предмета с программой и без"
    expected: "Предмет с levelCount > 0 — ошибка «Нельзя удалить предмет с программой…»; пустой предмет удаляется после deleteLevel всех уровней"
    why_human: "Серверная логика покрыта unit-тестами; клиентский UX confirm-модалок и цепочка deleteLevel → deleteSubject требует ручной проверки"
  - test: "Seed: три предмета с разным объёмом программы"
    expected: "После pnpm db:seed — Коран (полная программа), Таджвид (2×3 шага), Арабский (3×5 шагов); ученики на уровнях Корана"
    why_human: "Структура seed подтверждена статическим анализом; объём программ и привязка учеников не прогонялись в этой верификации"
---

# Phase 10: Subject Foundation — Verification Report

**Phase Goal:** Предметы и их программы существуют в системе — менеджер может создать предмет и настроить уровни/шаги  
**Verified:** 2026-07-07T18:39:00Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Менеджер создаёт, редактирует и удаляет предметы в админке | ✓ VERIFIED | `subject-actions.ts` (CRUD + `requireRoles`); `SubjectsList.tsx` + модалки; `/admin/subjects/page.tsx`; unit-тесты create/delete |
| 2 | У предмета есть своя программа: уровни и шаги | ✓ VERIFIED | `Level.subjectId` в schema; `getLevels(subjectId)`; маршруты `/admin/subjects/[subjectId]/program/**` |
| 3 | Редактор шагов с Tiptap работает в контексте предмета | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `StepEditor.tsx` (useEditor + StarterKit); `StepForm` → `createStep`/`updateStep`; subject-scoped routes; нет runtime/E2E-доказательства |
| 4 | Prisma: Subject, Level.subjectId, Step в скоупе предмета; seed с демо-предметом | ✓ VERIFIED | `schema.prisma` model Subject + `@@unique([subjectId, number])`; migration `20260707180000_add_subject`; `seed.ts` создаёт «Коран» с `DEFAULT_QURAN_SUBJECT_ID` |
| 5 | Старая глобальная программа заменена предметной моделью | ✓ VERIFIED | `src/app/(dashboard)/admin/program/` отсутствует; grep `src/` — 0 вхождений `/admin/program`; `revalidatePath` только через `program-paths` |
| 6 | getLevels и мутации требуют subjectId и фильтруют по предмету | ✓ VERIFIED | `getLevels` where `{ subjectId }`; `createLevelSchema` с `subjectId`; unit-тест `getLevels` |
| 7 | getLevelSteps отклоняет уровень чужого предмета (IDOR guard) | ✓ VERIFIED | `findFirst({ where: { id: levelId, subjectId } })`; unit-тест возвращает null |
| 8 | deleteLevel удаляет уровень без учеников, каскад шагов | ✓ VERIFIED | `deleteLevel` + student count guard; unit-тесты; `onDelete: Cascade` на Step→Level |
| 9 | Глобальные номера шагов считаются per subjectId | ✓ VERIFIED | `offsets.ts` `getLevelStepOffsets(subjectId)`; level page `toGlobalStepNumber`; `LevelStepsTable` показывает `(globalNumber)` |
| 10 | revalidatePath использует subject-scoped URLs | ✓ VERIFIED | `program-actions.ts` — только `programListPath`/`programLevelPath` и `/admin/subjects`; grep `/admin/program` в actions — 0 |
| 11 | Удаление предмета блокируется при наличии уровней | ✓ VERIFIED | `deleteSubject` level count + `BLOCKED_DELETE_MESSAGE`; клиентская проверка `levelCount > 0`; unit-тесты |
| 12 | AppShell: «Предметы» → /admin/subjects, /admin/program убран | ✓ VERIFIED | `AppShell.tsx` menu key `/admin/subjects`, label «Предметы»; `managerMenuOrder` без `/admin/program` |
| 13 | Seed: 3 предмета (Коран, Таджвид, Арабский) с разными программами | ✓ VERIFIED | `seed.ts` + `seedProgram` / `seedMiniProgram`; `subject.deleteMany` после `level.deleteMany` |
| 14 | Демо-ученики привязаны к уровням Корана после seed | ✓ VERIFIED | `levelId: quranLevels[profile.level - 1]!.id` в `seed.ts` |

**Score:** 13/14 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Subject model, Level.subjectId | ✓ VERIFIED | model Subject; Level.subjectId NOT NULL, onDelete Restrict |
| `prisma/migrations/20260707180000_add_subject/` | Prod-safe backfill | ✓ VERIFIED | INSERT Quran id; UPDATE levels; composite unique |
| `prisma/lib/subject-constants.ts` | DEFAULT_QURAN_SUBJECT_ID | ✓ VERIFIED | `clq10defaultquransubject00` совпадает с migration SQL |
| `src/shared/lib/validations/subject.ts` | Zod schemas | ✓ VERIFIED | create/update subject schemas |
| `src/shared/lib/validations/level.ts` | createLevelSchema + subjectId | ✓ VERIFIED | subjectId required |
| `src/features/subject-admin/actions/subject-actions.ts` | CRUD server actions | ✓ VERIFIED | 83 lines, substantive |
| `src/features/subject-admin/ui/SubjectsList.tsx` | List + modals | ✓ VERIFIED | wired to page + actions |
| `src/app/(dashboard)/admin/subjects/page.tsx` | Server page | ✓ VERIFIED | requireRoles + SubjectsList |
| `src/features/program-admin/actions/program-actions.ts` | Subject-scoped program CRUD | ✓ VERIFIED | getLevels, deleteLevel, subject-scoped revalidate |
| `src/shared/lib/student-progress/offsets.ts` | Per-subject offsets | ✓ VERIFIED | Map cache keyed by subjectId |
| `src/features/program-admin/lib/program-paths.ts` | URL helpers | ✓ VERIFIED | 4 path functions |
| `src/app/(dashboard)/admin/subjects/[subjectId]/program/**` | Program editor routes | ✓ VERIFIED | 4 route pages (list, level, new step, edit step) |
| `prisma/lib/seed-program.ts` | Parameterized seedProgram | ✓ VERIFIED | `seedProgram(prisma, { subjectId })` |
| `prisma/seed.ts` | Multi-subject demo | ✓ VERIFIED | 3 subjects, FK wipe order correct |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `SubjectsList` | `subject-actions` | create/update/delete server calls | ✓ WIRED | imports + onFinish/onOk handlers |
| `admin/subjects/page.tsx` | `SubjectsList` | SubjectRow props | ✓ WIRED | levelCount, stepCount mapped |
| `AppShell` | `/admin/subjects` | managerMenuOrder | ✓ WIRED | replaces legacy program entry |
| `program/page.tsx` | `getLevels(subjectId)` | server fetch | ✓ WIRED | Promise.all with getSubject |
| `StepForm` | `program-paths` | router.push after save | ✓ WIRED | `programLevelPath(subjectId, levelId)` |
| `LevelsTable` | `programLevelPath` | Link href | ✓ WIRED | subjectId prop on all links |
| `createLevel` | `Level.subjectId` | createLevelSchema | ✓ WIRED | Zod parse + prisma.create |
| `getLevelSteps` | subjectId param | findFirst where id AND subjectId | ✓ WIRED | IDOR guard in query |
| `deleteLevel` | `deleteSubject` guard | empty subject after level removal | ✓ WIRED | enables subject delete when levelCount=0 |
| `seed.ts` | `DEFAULT_QURAN_SUBJECT_ID` | explicit id on create | ✓ WIRED | matches migration constant |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `SubjectsList` | `subjects` | props from page | prisma.subject.findMany | ✓ FLOWING |
| `ProgramSubjectView` | `levels` | props from page | prisma.level.findMany({ subjectId }) | ✓ FLOWING |
| `LevelStepsView` | `steps` + `globalNumber` | props from level page | getLevelSteps + getStepOffsetForLevel | ✓ FLOWING |
| `StepForm` | `content` | StepEditor onChange | createStep/updateStep → prisma | ✓ FLOWING (save path wired; runtime Tiptap unverified) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Subject actions unit tests | `pnpm test:unit -- subject-actions.test.ts` | 13 tests in 3 files, all pass | ✓ PASS |
| Program actions subject scoping | `pnpm test:unit -- program-actions.test.ts` | getLevels, getLevelSteps IDOR, deleteLevel | ✓ PASS |
| Per-subject offsets | `pnpm test:unit -- offsets.test.ts` | different maps per subjectId | ✓ PASS |
| No legacy /admin/program in src | `grep /admin/program src/` | 0 matches | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — phase does not declare probe scripts.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUBJ-01 | 10-02 | CRUD предметов для менеджера/супер-админа | ✓ SATISFIED | subject-admin feature + /admin/subjects |
| SUBJ-02 | 10-01, 10-03 | У каждого предмета своя программа (уровни→шаги) | ✓ SATISFIED | Level.subjectId; subject-scoped program routes |
| SUBJ-03 | 10-01, 10-03 | Программа — шаблон на предмет | ✓ SATISFIED | Программа привязана к Subject, не к Group (Group.subjectId — Phase 11) |
| SUBJ-04 | 10-04 | Редактор программы с Tiptap для менеджера | ⚠️ NEEDS HUMAN | UI и server layer на месте; Tiptap runtime не проверен автоматически |
| SUBJ-18 | 10-01, 10-05 | Fresh-start schema + multi-subject seed | ✓ SATISFIED | migration + 3-subject seed.ts |

Все 5 requirement ID фазы 10 учтены. Orphaned requirements для Phase 10 в REQUIREMENTS.md не обнаружены.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `e2e/` | — | Нет spec для `/admin/subjects` | ℹ️ Info | Новый модуль без Playwright-тестов (правило new-module-tests); не блокирует must-haves фазы |
| `edit/page.tsx` | 16 | `getStep(stepId)` без проверки subjectId/levelId | ℹ️ Info | Потенциальный IDOR при знании stepId; вне scope must-haves Phase 10 |
| `.planning/codebase/STRUCTURE.md` | 240+ | Устаревшие ссылки на `/admin/program` | ℹ️ Info | Документация не синхронизирована; `src/` чист |

Debt markers (TBD/FIXME/XXX) в файлах фазы — не найдены.

### Human Verification Required

#### 1. Tiptap в контексте предмета

**Test:** Создать/отредактировать шаг через subject-scoped маршрут с rich content  
**Expected:** Контент сохраняется и отображается после reload; редирект на уровень  
**Why human:** Нет E2E; presence StepEditor ≠ подтверждение runtime Tiptap

#### 2. End-to-end сценарий менеджера

**Test:** Предметы → программа → уровень (модал) → шаг → breadcrumbs  
**Expected:** Навигация без 404; глобальные номера шагов per-subject  
**Why human:** Модалки и client navigation не покрыты автотестами

#### 3. Цепочка удаления

**Test:** deleteLevel всех уровней → deleteSubject  
**Expected:** Блокировка при levelCount > 0; успех для пустого предмета  
**Why human:** UX confirm-диалогов и полный flow

#### 4. Multi-subject seed

**Test:** `pnpm db:seed` на чистой БД  
**Expected:** 3 предмета, разный объём программ, ученики на Коране  
**Why human:** Не запускался в рамках верификации (mutating)

### Gaps Summary

Критических пробелов (FAILED must-haves) не обнаружено. Вся серверная логика, схема данных, маршруты и wiring подтверждены в коде и 13 unit-тестах. Единственный behavior-dependent truth (Tiptap runtime) и UI-потоки требуют ручной проверки перед статусом `passed`.

---

_Verified: 2026-07-07T18:39:00Z_  
_Verifier: Claude (gsd-verifier)_
