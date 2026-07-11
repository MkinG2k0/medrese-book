---
phase: 15-student-portal-extra-assignments
verified: 2026-07-11T23:07:00Z
status: passed
score: 21/22 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:

  - truth: "E2E покрывают dashboard cards, groupId navigation и subject filter каталога"
    test: "pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts --reporter=line"
    expected: "Оба spec завершаются без failures; сценарии enrollment cards, deep link groupId и Select «Предмет» проходят"
    why_human: "Spec-файлы содержат нужные сценарии, но Playwright не загружает playwright.config.ts (TypeError: context.conditions?.includes is not a function на Node v22.15). Прохождение E2E не подтверждено автоматически."
human_verification:

  - test: "Войти как ученик с несколькими зачислениями → /student/me"
    expected: "N карточек для N enrollments; на каждой — предмет, группа, уровень, ProgressBar, метрики месяца (Уроков/Шагов/Время обучения); две группы одного предмета дают две отдельные карточки"
    why_human: "Визуальная компоновка и корректность метрик на реальных данных не проверяются grep/tsc"

  - test: "Клик «Уроки» на карточке → F5 на странице уроков"
    expected: "URL сохраняет ?groupId=; подзаголовок остаётся для выбранной группы; localStorage содержит student-portal:lastGroupId"
    why_human: "E2E проверяет клик и URL, но не перезагрузку страницы; readStudentPortalGroupId не используется на server (by design D-08)"

  - test: "Меню «Уроки» без groupId"
    expected: "Открывается primary enrollment (первая группа по enrolledAt asc) — подзаголовок primary группы"
    why_human: "Логика resolveStudentGroupId подтверждена unit-тестом; primary на реальных seed-данных требует браузера"

  - test: "Учитель → /extra-assignments → сменить Select «Предмет»"
    expected: "Обновляются фильтры уровень/шаг и список шаблонов; шаблоны другого предмета не видны"
    why_human: "Wiring subjectId в API и UI подтверждён кодом; визуальная изоляция между предметами — UAT"

  - test: "Урок в журнале → модалка «Назначить доп. задание»"
    expected: "Список шаблонов только предмета группы; cross-step (шаблон другого шага того же предмета) доступен"
    why_human: "subjectId проброшен в AssignExtraAssignmentModal; runtime-изоляция между предметами не покрыта unit-тестом"

  - test: "Ученик → /student/extra-assignments"
    expected: "Collapse-секции по subject.name; таблица с датой, шагом, заданием, автором, оценкой"
    why_human: "groupBySubject в UI подтверждён кодом; визуальная группировка на seed-данных — UAT"

  - test: "pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts"
    expected: "Exit code 0 после устранения ошибки загрузки playwright.config.ts"
    why_human: "Блокер окружения: Playwright 1.61 + Node 22.15 — config load error; spec-файлы присутствуют и покрывают must-have сценарии"
---

# Phase 15: Student Portal & Extra Assignments Verification Report

**Phase Goal:** Student Portal & Extra Assignments — student dashboard per enrollment, groupId navigation, subject-scoped extra assignments, student history grouped by subject

**Verified:** 2026-07-11T23:07:00Z

**Status:** human_needed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ROADMAP SC1: портал показывает прогресс по каждому зачислению/предмету | ✓ VERIFIED | `getStudentEnrollmentDashboard` → `enrollments.map` на `/student/me` |
| 2 | ROADMAP SC2: допзадания фильтруются и назначаются в контексте шагов предмета | ✓ VERIFIED | API `subjectId` join; catalog Select; `AssignExtraAssignmentModal` + `subjectId` prop |
| 3 | ROADMAP SC3: история допзаданий группируется по предмету | ✓ VERIFIED | `StudentExtraAssignmentsHistory` → `groupBySubject` + Collapse |
| 4 | На `/student/me` — карточка на каждое GroupEnrollment | ✓ VERIFIED | `page.tsx` maps all enrollments; `notFound` если пусто |
| 5 | Карточка: предмет, группа, уровень, ProgressBar, метрики месяца | ✓ VERIFIED | `StudentEnrollmentCard.tsx` — Title, Text, ProgressBar, StudentMetricsCards |
| 6 | Две группы одного предмета → две карточки | ✓ VERIFIED | `findMany` без dedup по subjectId; одна карточка per enrollment |
| 7 | Прогресс через `getTotalProgramSteps(subjectId)` | ✓ VERIFIED | `student-actions.ts:70` per enrollment |
| 8 | Клик с карточки → lessons/history с `?groupId=` | ✓ VERIFIED | `StudentPortalGroupLink` + `buildStudentPortalHref` |
| 9 | Меню без groupId → primary enrollment | ✓ VERIFIED | `allowedGroupIds[0]` + `resolveStudentGroupId` fallback |
| 10 | groupId в URL сохраняется; localStorage при клике с карточки | ✓ VERIFIED | searchParams на server; `writeStudentPortalGroupId` в onClick |
| 11 | Уроки/история scoped by groupId | ✓ VERIFIED | `getStudentSessionHistory` where `groupId: enrollment.groupId` |
| 12 | Пункты меню «Уроки» и «История занятий» в AppShell | ✓ VERIFIED | `AppShell.tsx` lines 157–165, 218–219 |
| 13 | Справочник фильтрует шаги/шаблоны по предмету | ✓ VERIFIED | `ExtraAssignmentCatalogPage` subject Select + `useExtraAssignments({ subjectId })` |
| 14 | `getProgramStepsForExtraAssignments(subjectId)` — только levels предмета | ✓ VERIFIED | `prisma.level.findMany({ where: { subjectId } })` |
| 15 | Модалка назначения — только шаблоны предмета группы | ✓ VERIFIED | `AssignExtraAssignmentModal` required `subjectId` в filters |
| 16 | Cross-step внутри предмета сохранён | ✓ VERIFIED | filters не включают `displayStepId`; только `subjectId` |
| 17 | Subject scope через join без новой колонки schema | ✓ VERIFIED | `ExtraAssignment.stepId` → `Step.level.subjectId`; без migration |
| 18 | Ученик видит историю допзаданий с оценками | ✓ VERIFIED | `/student/extra-assignments` + `useStudentExtraAssignmentHistory` |
| 19 | История сгруппирована по предмету (Collapse) | ✓ VERIFIED | `groupBySubject` + Collapse items per subject |
| 20 | API history: STUDENT только свой studentId | ✓ VERIFIED | route.ts + vitest `allows STUDENT` / `403 foreign studentId` |
| 21 | Teacher/manager history API: optional subjectId filter | ✓ VERIFIED | vitest `filters by subjectId via session group or display step level` |
| 22 | E2E покрывают dashboard, groupId nav, subject filter | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Spec-файлы есть; Playwright config не загружается |

**Score:** 21/22 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/student-portal/lib/student-portal-query.ts` | URL helpers groupId | ✓ VERIFIED | exists, substantive, wired |
| `src/features/student-portal/lib/student-portal-storage.ts` | localStorage key | ✓ VERIFIED | write wired; read helper orphaned (не требуется D-08) |
| `src/features/student-portal/actions/student-actions.ts` | dashboard + scoped actions | ✓ VERIFIED | getStudentEnrollmentDashboard, resolveStudentEnrollment |
| `src/features/student-portal/ui/StudentEnrollmentCard.tsx` | enrollment card UI | ✓ VERIFIED | wired на /student/me |
| `src/app/(dashboard)/student/me/page.tsx` | dashboard page | ✓ VERIFIED | N cards |
| `src/features/student-portal/ui/StudentPortalGroupLink.tsx` | deep link client | ✓ VERIFIED | write + Link |
| `src/app/(dashboard)/student/lessons/page.tsx` | groupId from URL | ✓ VERIFIED | searchParams + resolve |
| `src/app/(dashboard)/student/history/page.tsx` | groupId from URL | ✓ VERIFIED | searchParams + resolve |
| `src/features/extra-assignments/actions/extra-assignment-actions.ts` | subject-scoped loaders | ✓ VERIFIED | getProgramStepsForExtraAssignments, getExtraAssignmentSubjects |
| `src/app/api/extra-assignments/route.ts` | subjectId filter | ✓ VERIFIED | where step.level.subjectId |
| `src/features/extra-assignments/ui/ExtraAssignmentCatalogPage.tsx` | subject Select | ✓ VERIFIED | refetch programLevels |
| `src/features/extra-assignments/ui/AssignExtraAssignmentModal.tsx` | subjectId prop | ✓ VERIFIED | wired from LessonStepsSection |
| `src/app/api/extra-assignments/history/route.ts` | STUDENT + subjectId | ✓ VERIFIED | role check + OR filter |
| `src/features/student-portal/ui/StudentExtraAssignmentsHistory.tsx` | grouped UI | ✓ VERIFIED | Collapse per subject |
| `src/app/(dashboard)/student/extra-assignments/page.tsx` | student page | ✓ VERIFIED | requireRole STUDENT |
| `e2e/student.spec.ts` | portal E2E | ✓ VERIFIED (exists) | execution blocked |
| `e2e/extra-assignments.spec.ts` | catalog subject E2E | ✓ VERIFIED (exists) | execution blocked |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| StudentEnrollmentCard | getStudentEnrollmentDashboard | props from page SSR | ✓ WIRED | page.tsx await dashboard |
| getStudentEnrollmentDashboard | loadStudentMetricsForMonth | subjectId + groupId per enrollment | ✓ WIRED | Promise.all in map |
| getStudentEnrollmentDashboard | getTotalProgramSteps | enrollment.group.subjectId | ✓ WIRED | line 70 |
| StudentPortalGroupLink | writeStudentPortalGroupId | onClick | ✓ WIRED | before navigation |
| lessons/history page | resolveStudentGroupId | searchParams.groupId | ✓ WIRED | both pages |
| getStudentSessionHistory | Session.groupId | prisma where | ✓ WIRED | filter by enrollment.groupId |
| ExtraAssignmentCatalogPage | GET /api/extra-assignments | useExtraAssignments subjectId | ✓ WIRED | filters memo |
| AssignExtraAssignmentModal | useExtraAssignments | subjectId in filters | ✓ WIRED | useMemo filters |
| getProgramStepsForExtraAssignments | Level.subjectId | prisma where | ✓ WIRED | required param |
| StudentExtraAssignmentsHistory | GET /api/extra-assignments/history | useStudentExtraAssignmentHistory | ✓ WIRED | fetch without studentId for STUDENT |
| history route | session.group.subjectId | include + resolveSubject | ✓ WIRED | response mapping |
| AppShell STUDENT nav | /student/extra-assignments | menu item | ✓ WIRED | «Доп. задания» added |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| StudentEnrollmentCard | enrollment.* | getStudentEnrollmentDashboard → prisma.groupEnrollment | ✓ DB query | ✓ FLOWING |
| StudentLessonsPage | data.lessons | getStudentLessons → prisma + completions | ✓ DB query | ✓ FLOWING |
| StudentHistoryPage | data.sessions | getStudentSessionHistory → prisma.session | ✓ DB query scoped | ✓ FLOWING |
| ExtraAssignmentCatalogPage | assignments | useExtraAssignments → API → prisma | ✓ DB query + subject filter | ✓ FLOWING |
| StudentExtraAssignmentsHistory | history | useStudentExtraAssignmentHistory → API | ✓ DB query + subject in response | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| resolveStudentGroupId + buildStudentPortalHref | `pnpm exec vitest run src/features/student-portal/lib/student-portal-query.test.ts` | 6/6 pass | ✓ PASS |
| History API STUDENT auth + subjectId filter | `pnpm exec vitest run src/app/api/extra-assignments/history/route.test.ts` | 5/5 pass | ✓ PASS |
| E2E portal + catalog | `pnpm exec playwright test e2e/student.spec.ts e2e/extra-assignments.spec.ts` | TypeError loading playwright.config.ts | ? SKIP |

### Probe Execution

Step 7c: SKIPPED — phase не объявляет probe scripts.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SUBJ-16 | 15-01, 15-02, 15-04 | Ученик видит прогресс по каждому своему предмету | ✓ SATISFIED | Dashboard cards per enrollment; scoped lessons/history; extra-assignments history page |
| SUBJ-17 | 15-03, 15-04 | Допзадания привязаны к шагам программы предмета | ✓ SATISFIED | subjectId filter API/catalog/modal; history grouped by subject |

**Orphaned requirements for Phase 15:** none — REQUIREMENTS.md maps только SUBJ-16 и SUBJ-17.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | TBD/FIXME/stub patterns в phase files | — | Не обнаружено |

`readStudentPortalGroupId` определён, но не импортируется — ℹ️ Info: осознанное решение D-08 (storage write-only при клике с карточки).

### Human Verification Required

1. **Дашборд /student/me** — N карточек с метриками на реальном ученике (см. frontmatter).
2. **Deep link + F5** — сохранение groupId в URL после перезагрузки.
3. **Primary enrollment из меню** — без groupId открывается первая группа.
4. **Каталог допзаданий** — смена предмета меняет шаги и шаблоны.
5. **Модалка на уроке** — изоляция шаблонов между предметами.
6. **История допзаданий ученика** — Collapse-секции по предметам.
7. **E2E suite** — прогон после fix Playwright/Node compatibility.

### Gaps Summary

**Реализация фазы 15 достигнута в коде:** все must-have артефакты существуют, подключены и используют реальные данные Prisma. Unit-тесты (11/11) проходят.

**Единственный незакрытый автоматический контур:** E2E spec-файлы написаны и покрывают must-have сценарии, но Playwright не запускается из-за ошибки загрузки конфига в текущем окружении. Это не пробел реализации, а блокер верификации, требующий human UAT и локального прогона E2E.

---

_Verified: 2026-07-11T23:07:00Z_
_Verifier: Claude (gsd-verifier)_
