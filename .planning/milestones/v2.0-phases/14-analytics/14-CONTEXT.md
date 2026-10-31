# Phase 14: Analytics - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза 14 доставляет **аналитику в скоупе выбранного предмета** (SUBJ-14, SUBJ-15):

- На `/analytics` — селект предмета (менеджер / учитель / супер-админ)
- Топ учеников, статистика по уровням, at-risk считаются для выбранного предмета
- История ученика в аналитике показывает занятия/шаги выбранного предмета

**Уже реализовано (не переделывать):** модалка истории учёбы (`StudentStudyHistoryModal`) по клику на ученика в топе — доработать только subject scope, не переписывать UI.

**Вне скоупа фазы 14:** портал ученика (Phase 15), журнал (Phase 13), CRUD предметов (Phase 10), **бухгалтерия / «Моя зарплата» / часы по группам для зарплаты** (отдельный quick task).

</domain>

<decisions>
## Implementation Decisions

### Subject filter (SUBJ-14)
- **D-01:** На странице `/analytics` добавить **селект предмета** в шапку рядом с существующими фильтрами (учитель, группа, месяц).
- **D-02:** Выбранный `subjectId` передаётся в **URL query** (по аналогии с `groupId` / `month` в `analytics-query.ts`) и сохраняется между перезагрузками.
- **D-03:** Список предметов: **менеджер/супер-админ** — все предметы; **учитель** — только предметы групп, где он `teacherId` (через `Group.subjectId`).

### Метрики в скоупе предмета (SUBJ-15)
- **D-04:** `getTopStudents`, `getLevelStats`, `getAtRiskStudents` принимают `subjectId` и фильтруют сессии/completions через **`Session.groupId → Group.subjectId`** (и уровни через `Level.subjectId`).
- **D-05:** Без выбранного предмета (или с невалидным id) — **не показывать смешанные данные всех предметов**; дефолтный предмет обязателен (см. discretion).
- **D-06:** `LevelStats`: при subject filter **не нужен** workaround «N (Предмет)» для дубликатов номеров уровней — в скоупе один предмет, `rowKey=levelId` сохранить.

### История ученика
- **D-07:** `StudentStudyHistoryModal` — фильтровать completions/sessions **по выбранному предмету** (prop `subjectId` с страницы аналитики или query в API `useStepCompletions`).
- **D-08:** Модалку **не переписывать** — только data scope.

### Связь с фильтрами учителя / группы
- **D-09:** Фильтры учитель + группа **остаются**; subject filter **сужает** universe данных. Группы в `AnalyticsGroupPicker` должны быть **совместимы** с выбранным предметом (planner: скрыть чужие группы или сбросить groupId при смене предмета).

### Claude's Discretion
- Дефолтный предмет: localStorage vs `DEFAULT_QURAN_SUBJECT_ID` vs первый в списке; поведение при первом визите.
- Ученик в **двух группах одного предмета** — одна строка в топе (агрегация) vs две (per enrollment); рекомендация: **агрегировать по studentId** в subject scope, unless ROADMAP implies per-group — document choice in plan.
- At-risk: какой enrollment использовать при нескольких группах одного предмета (primary vs worst-case vs per-group rows).
- `loadStudentMetricsForMonth` — расширить subject/group scope или обойти для at-risk в этой фазе.
- Server action `getAnalyticsSubjects()` vs reuse `getSubjects` из subject-admin.
- E2E: обновить/добавить `e2e/analytics*.spec.ts` под subject picker.
- Revalidate paths после изменений query params.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & requirements
- `.planning/PROJECT.md` — milestone v2.0, аналитика по предмету
- `.planning/REQUIREMENTS.md` — SUBJ-14, SUBJ-15; FND-01 (исключение adjustment / prior credit)
- `.planning/ROADMAP.md` — Phase 14 goal and success criteria

### Prior phase context
- `.planning/phases/12-progress-sessions/12-CONTEXT.md` — Session по groupId, прогресс per enrollment
- `.planning/phases/13-journal/13-CONTEXT.md` — предмет через Group.subjectId; паттерн URL query + localStorage

### Analytics feature (текущая реализация)
- `src/app/(dashboard)/analytics/page.tsx` — entry, фильтры teacher/group/month
- `src/features/analytics/lib/analytics-query.ts` — URL params; расширить под `subjectId`
- `src/features/analytics/actions/analytics-actions.ts` — teachers/groups; добавить subjects
- `src/features/analytics/ui/AnalyticsGroupPicker.tsx` — «Группа — Предмет» в label
- `src/shared/lib/analytics-queries/top-students.ts` — добавить subject scope
- `src/shared/lib/analytics-queries/level-stats.ts` — partial subject via groupId; generalize
- `src/shared/lib/analytics-queries/at-risk-students.ts` — сейчас без subject; uses `loadStudentMetricsForMonth`
- `src/shared/lib/analytics-queries/filters.ts` — FND-01 filters
- `src/features/analytics/ui/StudentStudyHistoryModal.tsx` — subject scope
- `src/features/analytics/ui/TopStudents.tsx` — opens history modal

### Quick fix reference (duplicate level keys)
- `.planning/quick/260712-12i-fix-duplicate-react-keys-in-levelstats-t/260712-12i-PLAN.md` — мотивация subject filter

### Subject constants
- `src/shared/lib/subject-constants.ts` — `DEFAULT_QURAN_SUBJECT_ID`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`AnalyticsGroupPicker` / `AnalyticsTeacherPicker` / `AnalyticsMonthPicker`** — паттерн client Select + `buildAnalyticsSearchParams` + router.push.
- **`getAnalyticsGroupsByTeacher`** — уже включает `subjectName`; groups имеют `subjectId` в Prisma.
- **`level-stats.ts`** — уже резолвит `groupSubjectId` при выбранной группе; Phase 14 обобщает на явный `subjectId`.
- **`StudentStudyHistoryModal` + `useStepCompletions`** — UI готов; нужен subject filter в query/API.
- **GroupsList subject filter** (`src/features/groups/ui/GroupsList.tsx`) — референс Ant Design Select для предметов.

### Established Patterns
- Subject scope через **`Group.subjectId`**, не отдельный `Session.subjectId` (Phase 12 D-04).
- Analytics filters в URL; FND-01 через `analyticsSessionFilter` / `analyticsCompletionFilter`.
- Server Component page → parallel `Promise.all` для метрик.

### Integration Points
- Расширить `buildAnalyticsSearchParams` и `AnalyticsPage` searchParams тип.
- Прокинуть `subjectId` в три query functions + at-risk metrics loader.
- При смене subject — согласовать `groupId` / `teacher` в picker chain.

</code_context>

<specifics>
## Specific Ideas

- Пользователь: **модалка истории в аналитике уже сделана** — только subject scope.
- Обсуждение subject filter **сокращено** — детали фильтров на planner/researcher.
- Известная проблема вне фазы: **«Моя зарплата» не показывает часы** + нужны **часы по группам** → quick task после планирования Phase 14.

</specifics>

<deferred>
## Deferred Ideas

### Quick task (после Phase 14 planning)
- **«Моя зарплата» — часы не отображаются** (`/accounting/my-salary`, `MySalaryPage`, `useMySalary` / `salaryAccrual.totalMinutes`).
- **Часы по группам** для учителя на странице зарплаты (аналог колонки «Группа» в модалке менеджера `SalariesPage` / `queryTeacherLessonsForMonth`).

### Out of scope
- Subject filter на `/analytics/teachers` (teacher lessons analytics) — не в ROADMAP Phase 14.
- Аналитика допзаданий (AASN-*) — отложено в PROJECT.md.

</deferred>

---

*Phase: 14-Analytics*
*Context gathered: 2026-07-12*
