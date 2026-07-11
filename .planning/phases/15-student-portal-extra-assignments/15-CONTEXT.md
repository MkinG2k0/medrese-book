# Phase 15: Student Portal & Extra Assignments - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза 15 доставляет **портал ученика по всем зачислениям и subject-scoped допзадания** (SUBJ-16, SUBJ-17):

- Портал ученика показывает прогресс **по каждому зачислению (группе)** с контекстом предмета
- Дополнительные задания фильтруются и назначаются в контексте **шагов программы предмета** группы
- История допзаданий в портале/карточке ученика **группируется по предмету** (success criteria ROADMAP п.3)

**Уже реализовано (адаптировать, не переписывать с нуля):**

- Портал `/student/me`, `/student/lessons`, `/student/history`, `/student/awards` — сейчас только `findPrimaryEnrollment`
- Модуль `extra-assignments`: справочник, назначение на уроке, API history для учителя/менеджера — **без subject scope**
- `getProgramStepsForExtraAssignments()` загружает все уровни без фильтра по предмету

**Вне скоупа фазы 15:** аналитика допзаданий (AASN-*), чат, карточка ученика для менеджера (отдельный backlog PROJECT.md).

</domain>

<decisions>
## Implementation Decisions

### Портал ученика — layout (SUBJ-16)
- **D-01:** Главная страница `/student/me` — **дашборд с карточками** (не табы, не единый subject-select).
- **D-02:** **Одна карточка на каждое зачисление (GroupEnrollment)** — при двух группах одного предмета две карточки («Коран — Группа А», «Коран — Группа Б»), согласовано с Phase 12 D-01 (прогресс per enrollment).
- **D-03:** На карточке: название предмета, группа, уровень, **прогресс-бар** (шаг N из M в скоупе предмета группы).
- **D-04:** На каждой карточке — **метрики месяца per enrollment** (`StudentMetricsCards`, subject/group scope как в Phase 14), не агрегат сверху.

### Навигация ученика
- **D-05:** Переход в «Уроки» / «История занятий» — **клик с карточки** на `/student/me` с `?groupId=...` в URL.
- **D-06:** Пункты меню **«Уроки» и «История занятий» остаются** в боковой навигации (`AppShell`).
- **D-07:** Контекст группы в URL — **query param `groupId`** (паттерн journal/analytics); localStorage для запоминания последнего выбора при переходе с карточки.
- **D-08:** Прямой вход в «Уроки»/«История» из меню **без `groupId`** — дефолт **primary enrollment** (первая группа по `enrolledAt asc`, как `findPrimaryEnrollment`).

### Claude's Discretion

**Области не обсуждались с пользователем — planner/researcher решают по ROADMAP, паттернам Phase 13–14 и существующему коду:**

- **SUBJ-17 — справочник допзаданий:** обязательный subject scope (фильтр/селект предмета; шаги только выбранного предмета). Рекомендация: subject через `Step.level.subjectId`, дефолт — предмет primary группы учителя или явный Select.
- **SUBJ-17 — назначение на уроке:** в модалке только шаблоны шагов **предмета группы** (`Session.groupId → Group.subjectId`); cross-step **внутри предмета** сохранить (quick task 260705).
- **История допзаданий для ученика (ROADMAP п.3):** новая секция/страница в портале; группировка **по предмету**; ученик видит свои назначения и оценки. Рекомендация: расширить student API (сейчас history только TEACHER/MANAGER).
- **Карточка ученика (teacher/manager):** subject-grouped history в analytics modal или student-admin — если не в ROADMAP явно, минимум: API history с `subjectId` filter + UI в портале ученика.
- Имена ключей localStorage, E2E (`e2e/student-portal.spec.ts`, extra-assignments subject filter), миграции schema (subject scope через join, не новая колонка — если достаточно `stepId`/`displayStepId`).
- `getTotalProgramSteps(subjectId)` и offsets — уже subject-scoped; заменить вызовы без `subjectId` в student-portal.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & requirements
- `.planning/PROJECT.md` — milestone v2.0, портал ученика, допзадания
- `.planning/REQUIREMENTS.md` — SUBJ-16, SUBJ-17
- `.planning/ROADMAP.md` — Phase 15 goal and success criteria

### Prior phase context
- `.planning/phases/12-progress-sessions/12-CONTEXT.md` — прогресс per GroupEnrollment, Session по groupId
- `.planning/phases/13-journal/13-CONTEXT.md` — URL `groupId` + localStorage; предмет через Group.subjectId
- `.planning/phases/14-analytics/14-CONTEXT.md` — subject filter, метрики per subject/group

### Extra assignments (pre-subject quick task)
- `.planning/quick/260705-q01-extra-assignments/260705-q01-CONTEXT.md` — модель template + instance, cross-step, фильтры модалки
- `prisma/schema.prisma` — `ExtraAssignment`, `StudentExtraAssignment`, `displayStepId`, `stepId`
- `src/features/extra-assignments/` — catalog, assign modal, session cards
- `src/app/api/extra-assignments/history/route.ts` — history API (teacher/manager; расширить subject filter + student role)

### Student portal (текущая реализация)
- `src/features/student-portal/actions/student-actions.ts` — `findPrimaryEnrollment` everywhere; расширить на all enrollments + groupId param
- `src/app/(dashboard)/student/me/page.tsx` — single progress bar → dashboard cards
- `src/app/(dashboard)/student/lessons/page.tsx` — lessons per enrollment level
- `src/app/(dashboard)/student/history/page.tsx` — sessions without group filter
- `src/widgets/app-shell/ui/AppShell.tsx` — student nav items

### Subject-scoped progress helpers
- `src/shared/lib/student-progress/offsets.ts` — `getStepOffsetForLevel(levelNumber, subjectId)`, `getTotalProgramSteps(subjectId)`
- `src/shared/lib/enrollment.ts` — `findPrimaryEnrollment`, `findEnrollmentInGroup`
- `src/shared/lib/student-metrics/load-student-metrics.ts` — уже принимает `subjectId` + `groupId`

### Pitfalls
- `.planning/research/PITFALLS.md` — допзадания: привязка к `stepId`, не к global idx

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`StudentMetricsCards`** — variant `portal`; передавать metrics per enrollment/subject.
- **`ProgressBar`** — на карточке дашборда.
- **`findEnrollmentInGroup` / all enrollments query** — заменить single primary в student-actions.
- **`ExtraAssignmentCatalogPage` + `AssignExtraAssignmentModal`** — добавить subject scope к filters и `programLevels`.
- **`buildAnalyticsSearchParams` pattern** — аналог для student portal URL с `groupId`.

### Established Patterns
- Прогресс и сессии scoped by **groupId** (Phase 12); предмет через **Group.subjectId** (Phase 13–14).
- Student portal: Server Component + `requireRole('STUDENT')` + server actions.
- Extra assignments: отдельный API, не смешивать с POST `/api/sessions` (quick task plan).

### Integration Points
- **`getStudentProfile` / `getStudentLessons` / `getStudentSessionHistory`** — принимать `groupId`, резолвить enrollment, subject-scoped steps/totals.
- **`getProgramStepsForExtraAssignments`** — filter `Level.subjectId`.
- **`/api/extra-assignments` + history route** — subject filter via step/session/group joins.
- **Journal `AssignExtraAssignmentModal`** — передать subjectId/group context для фильтра шаблонов.

</code_context>

<specifics>
## Specific Ideas

- Дашборд — «плитки» по группам, не свёрнутый список предметов.
- Метрики месяца на каждой карточке, не общий блок сверху.
- Deep link с карточки в уроки/историю; меню сохраняется для привычной навигации.

</specifics>

<deferred>
## Deferred Ideas

- **Subject-select вместо карточек** — отклонено (D-01: dashboard cards).
- **Одна карточка на предмет** (aggregate/best progress) — отклонено (D-02: card per enrollment).
- **Убрать «Уроки»/«История» из меню** — отклонено (D-06).
- **Глобальный Select группы на страницах уроков** — не выбрано; вход через карточку + дефолт primary из меню (D-05, D-08).
- **Справочник допзаданий, назначение на уроке, история допзаданий для ученика** — не обсуждались детально; на planner (Claude's Discretion + ROADMAP success criteria).
- **Аналитика допзаданий (AASN-*)** — вне фазы (PROJECT.md backlog).

</deferred>

---

*Phase: 15-Student Portal & Extra Assignments*
*Context gathered: 2026-07-12*
