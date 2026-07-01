---
phase: 01-student-analytics-history
verified: 2026-07-01T19:45:00Z
status: human_needed
score: 14/18 must-haves verified
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:
  - truth: "Преподаватель запускает и завершает урок вручную; elapsed-таймер виден в журнале во время активного урока (ANLY-01/02)"
    test: "Войти как teacher2 → /journal → «Начать урок» → убедиться в «Урок идёт» и растущей «Длительность» → «Закончить урок»"
    expected: "Таймер тикает во время урока; после завершения журнал разблокирован; startedAt/endedAt сохранены в TeachingSession"
    why_human: "E2E `e2e/student-analytics.spec.ts` существует, но не запускался (нужен dev-сервер + seed); presence-проверки не доказывают runtime-тик таймера"
  - truth: "NormWarningAlert появляется на странице урока при реальном нарушении TIME_NORM (ANLY-07)"
    test: "Открыть урок ученика с превышенным нормативом (фактическое время > суммы Step.hours пройденных шагов уровня)"
    expected: "Жёлтый Alert «Превышен норматив времени на текущем уровне»"
    why_human: "Логика evaluateTimeNormForLevel покрыта unit-тестами; условный рендер NormWarningAlert по riskFlags не проверен на живых данных"
  - truth: "JournalRiskBadge отображается у ученика в списке журнала при непустых riskFlags (D-08)"
    test: "Войти как TEACHER/MANAGER → /journal → найти ученика с TIME_NORM или ATTENDANCE"
    expected: "Tag «Норматив» и/или «Пропуски» рядом с именем"
    why_human: "Wiring useStudentRiskFlags → JournalStudentsTable подтверждён; отображение зависит от данных seed и не воспроизведено в прогоне"
  - truth: "E2E-сценарии student-analytics.spec.ts проходят в CI/локально"
    test: "pnpm exec playwright test e2e/student-analytics.spec.ts"
    expected: "Все 4 теста green"
    why_human: "Playwright-тесты не запускались в среде верификатора (требуется сервер и .env.test)"
human_verification:
  - test: "Прогнать e2e/student-analytics.spec.ts локально или в CI"
    expected: "Таймер урока, at-risk→история с колонкой «Длительность занятия», портал без «Требуют внимания» — все green"
    why_human: "E2E — единственная автоматическая проверка сквозного UX фазы; файлы существуют, прогон не выполнен"
  - test: "Визуально проверить badge в журнале и Alert на странице урока на ученике с riskFlags"
    expected: "Badge и Alert соответствуют UI-SPEC (цвета Tag warning/error, Tooltip)"
    why_human: "Визуальное качество и Ant Design-стили не верифицируются grep/presence"
---

# Phase 1: Student Analytics & History — Verification Report

**Phase Goal:** Учитель, менеджер и ученик видят реальный прогресс обучения — время, шаги, историю и предупреждения о нормативах  
**Verified:** 2026-07-01T19:45:00Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Преподаватель вручную запускает/завершает урок; `startedAt`/`endedAt` сохраняются (ANLY-01) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `POST /api/teaching-sessions` создаёт сессию с `startedAt`; `PATCH /api/teaching-sessions/[id]` пишет `endedAt` и `durationMinutes` в domain event. E2E существует, не запускался |
| 2 | В журнале отображается elapsed-таймер текущего урока (ANLY-02) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `LessonTimerBar.tsx` — `setInterval` по `session.startedAt`, формат elapsed. Wiring в `StudentList`. Runtime-тик не проверен |
| 3 | Ученик/учитель/менеджер видят уроки, шаги и время за период (ANLY-03…05) | ✓ VERIFIED | `StudentMetricsCards` на `/student/me` и в `LessonPageHeader`; `GET /api/student-metrics` → `loadStudentMetricsForMonth`; unit-тесты `computePeriodMetrics` |
| 4 | Прогресс по уровням и шагам программы (ANLY-06) | ✓ VERIFIED | `computeLevelProgress` + `levelProgress` в API; `ProgressBar` на `/student/me`; заголовок урока с шагом/уровнем |
| 5 | Шаги «зачтено ранее» не входят в статистику (ANLY-10) | ✓ VERIFIED | `countableCompletionWhere` в `filters.ts`; тесты исключают `isPriorCredit: true` в `period-metrics.test.ts` и `time-norm.test.ts` |
| 6 | При нарушении норматива времени показывается предупреждение (ANLY-07) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `evaluateTimeNormForLevel` + unit-тесты; `NormWarningAlert` на `LessonPage` при `TIME_NORM`. Норматив = сумма `Step.hours` (CONTEXT D-01), не фиксированные 48ч из ROADMAP |
| 7 | История ученика — хронологическая лента с длительностью занятий (ANLY-08/09) | ✓ VERIFIED | `StudentStudyHistoryModal` — колонка «Длительность занятия»; `/student/history` + `StudentSessionsTable`; `step-completions` API обогащает `sessionDurationMinutes` |
| 8 | `GET /api/student-metrics` — метрики периода с авторизацией | ✓ VERIFIED | `route.ts` — `authorizeApiRequest` с ролями TEACHER/MANAGER/SUPER_ADMIN/STUDENT + `loadStudentMetricsForMonth` |
| 9 | `GET /api/at-risk-students` недоступен STUDENT (D-07) | ✓ VERIFIED | `allowedRoles` без STUDENT; vitest `route.test.ts` — 403 для STUDENT (прогон: pass) |
| 10 | `GET /api/students/risk-flags` — batch `riskFlags[]` для журнала | ✓ VERIFIED | `route.ts` + `useStudentRiskFlags` в `StudentList` |
| 11 | `GET /api/step-completions` включает `sessionDurationMinutes` | ✓ VERIFIED | `teachingSessionDurationFromMap` в `step-completions/route.ts` |
| 12 | Метрики периода исключают adjustment-сессии и prior credit | ✓ VERIFIED | `period-metrics.ts` + 4 unit-теста в `period-metrics.test.ts` |
| 13 | Норматив = сумма `Step.hours` пройденных шагов уровня (D-01…D-03) | ✓ VERIFIED | `time-norm.ts` — `budgetMinutes` из `completedStepsOnLevel`; тесты violation/within budget |
| 14 | Флаг посещаемости: 3+ ABSENT за месяц ИЛИ 3 подряд (D-09) | ✓ VERIFIED | `attendance-risk.ts` + 4 unit-теста |
| 15 | `riskFlags[]` только TIME_NORM и/или ATTENDANCE (D-06) | ✓ VERIFIED | `AT_RISK_CONFIG.enabledSignals` + тесты `buildStudentRiskFlags` |
| 16 | `/analytics`: порядок AtRisk → TopStudents → LevelStats (UI-SPEC) | ✓ VERIFIED | `analytics/page.tsx` — `AtRiskStudentsTable` первым блоком |
| 17 | `/student/me` — три метрики без at-risk (D-07) | ✓ VERIFIED | `StudentMetricsCards variant="portal"`; нет at-risk компонентов; E2E assert `Требуют внимания` count 0 |
| 18 | Клик по строке at-risk открывает `StudentStudyHistoryModal` | ✓ VERIFIED | `AtRiskStudentsTable` — `onRow` → `setSelectedStudent` → Modal |

**Score:** 14/18 truths verified (4 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/lib/student-metrics/at-risk-config.ts` | Единый конфиг порогов (D-05) | ✓ VERIFIED | `AT_RISK_CONFIG`, `actualTimeSource: 'teaching_session'` |
| `src/shared/lib/student-metrics/time-norm.ts` | Расчёт норматива | ✓ VERIFIED | 188 строк логики + тесты |
| `src/shared/lib/student-metrics/risk-flags.ts` | Сборка riskFlags | ✓ VERIFIED | Используется в `load-student-metrics.ts` |
| `src/shared/lib/student-metrics/period-metrics.ts` | Метрики периода | ✓ VERIFIED | Связан с `filters.ts` |
| `src/shared/lib/analytics-queries/at-risk-students.ts` | getAtRiskStudents | ✓ VERIFIED | SSR на `/analytics` |
| `src/shared/lib/teaching-session-duration-map.ts` | Маппинг дата→duration | ✓ VERIFIED | Используется в step-completions и portal history |
| `src/app/api/student-metrics/route.ts` | REST метрик | ✓ VERIFIED | |
| `src/app/api/at-risk-students/route.ts` | REST at-risk | ✓ VERIFIED | |
| `src/app/api/students/risk-flags/route.ts` | Batch flags | ✓ VERIFIED | |
| `src/features/journal/ui/JournalRiskBadge.tsx` | Badge в журнале | ✓ VERIFIED | Tag+Tooltip, wired в `JournalStudentsTable` |
| `src/features/journal/ui/NormWarningAlert.tsx` | Alert на уроке | ✓ VERIFIED | Wired в `LessonPage` |
| `src/features/analytics/ui/AtRiskStudentsTable.tsx` | Таблица отстающих | ✓ VERIFIED | Data-flow от `getAtRiskStudents` SSR |
| `src/features/analytics/ui/StudentMetricsCards.tsx` | Карточки метрик | ✓ VERIFIED | Portal + lesson header |
| `e2e/student-analytics.spec.ts` | E2E smoke | ✓ VERIFIED (exists) | 4 теста; прогон не выполнен |
| `src/app/api/at-risk-students/route.test.ts` | Auth gate | ✓ VERIFIED | 2 теста, vitest pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `period-metrics.ts` | `analytics-queries/filters.ts` | countableSessionWhere / countableCompletionWhere | ✓ WIRED | pattern match |
| `time-norm.ts` | `at-risk-config.ts` | AT_RISK_CONFIG | ✓ WIRED | |
| `at-risk-students/route.ts` | `authorize-api-request.ts` | allowedRoles TEACHER, MANAGER, SUPER_ADMIN | ✓ WIRED | |
| `step-completions/route.ts` | `teaching-session-duration-map.ts` | sessionDurationMinutes | ✓ WIRED | |
| `StudentList.tsx` | `use-student-risk-flags.ts` | useStudentRiskFlags(groupId, dateFilter) | ✓ WIRED | |
| `LessonPage.tsx` | `journal-actions.ts` | getStudentLesson → riskFlags, periodMetrics | ✓ WIRED | |
| `analytics/page.tsx` | `at-risk-students.ts` | getAtRiskStudents SSR | ✓ WIRED | |
| `StudentStudyHistoryModal.tsx` | `use-step-completions.ts` | session.sessionDurationMinutes | ✓ WIRED | |
| `AtRiskStudentsTable.tsx` | `StudentStudyHistoryModal.tsx` | onRow click | ✓ WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `AtRiskStudentsTable` | `data: AtRiskStudentRow[]` | `getAtRiskStudents` → Prisma + `loadStudentMetricsForMonth` | ✓ | ✓ FLOWING |
| `StudentMetricsCards` (portal) | `periodMetrics` | `getStudentPeriodMetrics` → `loadStudentMetricsForMonth` | ✓ | ✓ FLOWING |
| `StudentStudyHistoryModal` | `completions` | `useStepCompletions` → API + duration map | ✓ | ✓ FLOWING |
| `JournalStudentsTable` | `riskFlags` | `useStudentRiskFlags` → `/api/students/risk-flags` | ✓ | ✓ FLOWING |
| `LessonTimerBar` | `elapsedLabel` | `useTeachingSession` → `/api/teaching-sessions` + client tick | ✓ | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit: period metrics exclusion | `pnpm exec vitest run src/shared/lib/student-metrics/period-metrics.test.ts` | 21 tests in 4 files pass | ✓ PASS |
| Unit: at-risk STUDENT forbidden | `pnpm exec vitest run src/app/api/at-risk-students/route.test.ts` | 403 test pass | ✓ PASS |
| E2E: timer + portal + history | `pnpm exec playwright test e2e/student-analytics.spec.ts` | Not run (no server) | ? SKIP |

### Probe Execution

Step 7c: SKIPPED — фаза не объявляет probe-скрипты.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ANLY-01 | 01-03, 01-05 | Ручной старт/стоп урока, startedAt/endedAt | ✓ SATISFIED | teaching-sessions POST/PATCH; E2E spec |
| ANLY-02 | 01-03, 01-05 | Таймер elapsed в журнале | ✓ SATISFIED | LessonTimerBar; E2E spec |
| ANLY-03 | 01-01…04 | Уроки за период | ✓ SATISFIED | computePeriodMetrics.lessonsCount + UI cards |
| ANLY-04 | 01-01…04 | Шаги за период | ✓ SATISFIED | stepsCount + UI |
| ANLY-05 | 01-01…04 | Общее время обучения | ✓ SATISFIED | totalMinutes из teaching_session duration |
| ANLY-06 | 01-03, 01-04 | Прогресс по уровням/шагам | ✓ SATISFIED | levelProgress + ProgressBar |
| ANLY-07 | 01-01…05 | Предупреждение о нормативе | ✓ SATISFIED | time-norm + NormWarningAlert + at-risk flags |
| ANLY-08 | 01-02, 01-04, 01-05 | История: лента занятий/оценок/шагов | ✓ SATISFIED | StudentStudyHistoryModal, StudentSessionsTable |
| ANLY-09 | 01-02, 01-04, 01-05 | Время по каждому занятию в истории | ✓ SATISFIED | sessionDurationMinutes column |
| ANLY-10 | 01-01, 01-02, 01-05 | Prior credit исключён | ✓ SATISFIED | filters + unit tests |

Все 10 requirement ID из PLAN frontmatter учтены; orphaned requirements для Phase 1 в REQUIREMENTS.md отсутствуют.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | Debt markers (TBD/FIXME/TODO) в изменённых файлах фазы | — | Не обнаружено |

### Human Verification Required

### 1. E2E student-analytics

**Test:** `pnpm exec playwright test e2e/student-analytics.spec.ts`  
**Expected:** 4/4 green — таймер, at-risk→история, analytics block, портал без at-risk  
**Why human:** Playwright требует running app + seed; верификатор не запускал сервер

### 2. Badge и Alert на живых данных

**Test:** Найти ученика с riskFlags в seed; открыть журнал и страницу урока  
**Expected:** JournalRiskBadge и NormWarningAlert видны учителю/менеджеру; ученик на `/student/me` их не видит  
**Why human:** Условный рендер по данным БД не воспроизведён

### 3. Норматив vs ROADMAP «48 часов»

**Test:** Убедиться, что на 1-м уровне предупреждение срабатывает при превышении суммы `Step.hours`, а не фиксированных 48ч  
**Expected:** Соответствие CONTEXT D-01…D-04 (осознанное отклонение от буквального SC ROADMAP)  
**Why human:** ROADMAP SC4 говорит «48 часов»; реализация — сумма часов программы

### Gaps Summary

Кодовая база **доставляет заявленную функциональность фазы 1**: модуль `student-metrics`, REST API, журнальный UX (таймер, badge, alert), аналитика at-risk, портал ученика и история с длительностью — всё существует, связано и покрыто unit-тестами (21 pass).

**Блокеров (FAILED must-haves) нет.** Статус `human_needed` из-за четырёх behavior-dependent истин, для которых E2E существует, но не был выполнен в среде верификации, и визуальные сценарии требуют ручной проверки на seed-данных.

После успешного прогона E2E и визуальной проверки badge/alert фазу можно считать полностью верифицированной.

---

_Verified: 2026-07-01T19:45:00Z_  
_Verifier: Claude (gsd-verifier)_
