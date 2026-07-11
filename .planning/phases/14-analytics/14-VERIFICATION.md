---
phase: 14-analytics
verified: 2026-07-12T01:32:00+03:00
status: human_needed
score: 11/12 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "E2E подтверждают subject picker и subject-scoped history"
    test: "pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts"
    expected: "Все сценарии зелёные: селект «Предмет», subjectId в URL, модалка истории, сброс groupId при смене предмета"
    why_human: "E2E требуют поднятый dev-сервер и seed; верификатор не запускал Playwright в этом прогоне"
human_verification:
  - test: "Запустить E2E wave gate: pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts"
    expected: "Все тесты проходят; селект «Предмет» виден; subjectId в URL; модалка истории открывается; смена предмета сбрасывает groupId (или skip при одном предмете в seed)"
    why_human: "Playwright не выполнялся в автоматической верификации"
  - test: "Войти как учитель с одной группой → /analytics → открыть селект «Предмет»"
    expected: "В списке только предметы групп этого учителя"
    why_human: "Role-scoped список реализован в getAnalyticsSubjects, но видимость в UI зависит от seed и сессии"
  - test: "Выбрать предмет → убедиться что URL содержит subjectId → F5"
    expected: "После перезагрузки тот же предмет выбран, метрики в том же скоупе"
    why_human: "Поведение reload зависит от браузера и Next.js SSR; unit-тесты покрывают только resolveAnalyticsSubjectFilter"
---

# Phase 14: Analytics — отчёт верификации

**Цель фазы:** Аналитика фильтруется по предмету — пользователь выбирает предмет, все метрики и история отфильтрованы по предмету.

**Верифицировано:** 2026-07-12T01:32:00+03:00  
**Статус:** human_needed  
**Повторная верификация:** Нет — первичная

## Достижение цели

### Наблюдаемые истины

| # | Истина | Статус | Доказательство |
|---|--------|--------|----------------|
| 1 | На `/analytics` есть селект предмета (ROADMAP SC #1, SUBJ-14) | ✓ VERIFIED | `AnalyticsSubjectPicker` в шапке `page.tsx` (стр. 110–115), `aria-label="Предмет"` |
| 2 | `subjectId` в URL и сохраняется при навигации | ✓ VERIFIED | `buildAnalyticsSearchParams` + `ANALYTICS_SUBJECT_PARAM`; pickers вызывают `router.push` с `subjectId`; `resolveAnalyticsSubjectFilter` читает URL |
| 3 | Учитель видит только предметы своих групп; менеджер/супер-админ — все | ✓ VERIFIED | `getAnalyticsSubjects`: teacher → `group.findMany` по `teacherId`; manager/super_admin → `subject.findMany` |
| 4 | Группы совместимы с предметом; смена предмета сбрасывает `groupId` | ✓ VERIFIED | `teacherGroups.filter(group.subjectId === filterSubjectId)`; `AnalyticsSubjectPicker` сбрасывает `groupId` до `ALL_GROUPS`; E2E-тест в `student-analytics.spec.ts` |
| 5 | Без валидного subject scope нет смешанных метрик | ✓ VERIFIED | `resolveAnalyticsSubjectFilter` всегда возвращает дефолт из allowed set; early return при пустом списке предметов |
| 6 | Топ, уровни, at-risk считаются в скоупе предмета (ROADMAP SC #2, SUBJ-15) | ✓ VERIFIED | `page.tsx` передаёт `filterSubjectId` во все три query; Prisma `where` с `group.subjectId` / `level.subjectId` |
| 7 | `getLevelStats`: label = номер уровня без суффикса предмета | ✓ VERIFIED | `label: String(level.number)`; `hasMultipleSubjects` удалён; unit-тест `level-stats.test.ts` |
| 8 | Ученик в двух группах одного предмета — одна строка в топе | ✓ VERIFIED | `getTopStudents` агрегирует по `studentId`; unit-тест `aggregates metrics into one row per student` |
| 9 | `getAtRiskStudents` / `loadStudentMetricsForMonth` в subject scope | ✓ VERIFIED | `buildGroupScopeFilter(subjectId)`; `StudentMetricsScope.subjectId` обязателен; worst-case enrollment в `load-student-metrics.test.ts` |
| 10 | История учёбы в модалке — только выбранный предмет (ROADMAP SC #3) | ✓ VERIFIED | `StudentStudyHistoryModal` → `useStepCompletions(..., subjectId)`; API `GET /api/step-completions?subjectId` фильтрует `session.group.subjectId` |
| 11 | UI модалки не переписан (D-08) | ✓ VERIFIED | Структура `Modal` / `Tabs` / `Table` / columns сохранена; добавлен только prop `subjectId` |
| 12 | E2E подтверждают subject picker и subject-scoped history | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Spec-файлы существуют и содержат нужные сценарии; Playwright не запускался в этом прогоне |

**Счёт:** 11/12 истин верифицировано (1 present, behavior-unverified)

### Покрытие требований

| Requirement | План | Описание | Статус | Доказательство |
|-------------|------|----------|--------|----------------|
| SUBJ-14 | 14-01, 14-03 | На странице аналитики менеджер/учитель выбирает предмет | ✓ SATISFIED | `AnalyticsSubjectPicker`, URL `subjectId`, role-scoped `getAnalyticsSubjects` |
| SUBJ-15 | 14-02, 14-03 | Метрики в скоупе выбранного предмета | ✓ SATISFIED | `getTopStudents` / `getLevelStats` / `getAtRiskStudents` + история через `step-completions` API |

Оба ID из PLAN frontmatter учтены; orphaned requirements для Phase 14 нет.

### Обязательные артефакты

| Артефакт | Ожидание | Статус | Детали |
|----------|----------|--------|--------|
| `src/features/analytics/ui/AnalyticsSubjectPicker.tsx` | Селект предмета | ✓ VERIFIED | Wired в `page.tsx` |
| `src/features/analytics/lib/analytics-storage.ts` | Storage key | ✓ VERIFIED | `ANALYTICS_SUBJECT_STORAGE_KEY`; `write` при смене предмета |
| `src/features/analytics/actions/analytics-actions.ts#getAnalyticsSubjects` | Role-scoped список | ✓ VERIFIED | Substantive, используется на page и at-risk API |
| `src/features/analytics/lib/analytics-query.ts#resolveAnalyticsSubjectFilter` | URL resolver | ✓ VERIFIED | 6 unit-тестов проходят |
| `src/shared/lib/analytics-queries/top-students.ts` | +subjectId | ✓ VERIFIED | `buildGroupScopeFilter`, wired из page |
| `src/shared/lib/analytics-queries/level-stats.ts` | +subjectId | ✓ VERIFIED | `where: { subjectId }` |
| `src/shared/lib/analytics-queries/at-risk-students.ts` | +subjectId | ✓ VERIFIED | Enrollment filter по subject |
| `src/shared/lib/student-metrics/load-student-metrics.ts` | scope.subjectId | ✓ VERIFIED | Worst-case enrollment |
| `src/app/api/step-completions/route.ts` | subject filter | ✓ VERIFIED | `session.group.subjectId`, `isPriorCredit: false` |
| `src/entities/step-completion/api/use-step-completions.ts` | optional subjectId | ✓ VERIFIED | queryKey + URLSearchParams |
| `src/features/analytics/ui/StudentStudyHistoryModal.tsx` | subjectId prop | ✓ VERIFIED | Передаётся из `TopStudents` / `AtRiskStudentsTable` |
| `e2e/analytics-student-history.spec.ts` | E2E history | ✓ EXISTS | Содержит проверки селекта и модалки |
| `e2e/student-analytics.spec.ts` | E2E picker + group reset | ✓ EXISTS | Тест смены предмета |

### Проверка связей (key links)

| From | To | Via | Статус | Детали |
|------|-----|-----|--------|--------|
| `AnalyticsSubjectPicker` | `buildAnalyticsSearchParams` | `router.push` с `subjectId` | ✓ WIRED | `onChange` → `writeAnalyticsSubjectId` + push |
| `analytics/page.tsx` | `getAnalyticsSubjects` | server load + `resolveAnalyticsSubjectFilter` | ✓ WIRED | Стр. 52–57 |
| `analytics/page.tsx` | `AnalyticsGroupPicker` | groups по `filterSubjectId` | ✓ WIRED | `teacherGroups.filter` |
| `analytics/page.tsx` | query functions | `filterSubjectId` обязателен | ✓ WIRED | `Promise.all` стр. 92–101 |
| `top-students.ts` | `Session.group.subjectId` | Prisma where | ✓ WIRED | Unit-тест подтверждает where |
| `level-stats.ts` | `Level.subjectId` | Prisma where | ✓ WIRED | Unit-тест подтверждает where |
| `TopStudents` | `StudentStudyHistoryModal` | prop `subjectId` | ✓ WIRED | Стр. 85–91 |
| `useStepCompletions` | `GET /api/step-completions` | query param `subjectId` | ✓ WIRED | fetch с params |
| `step-completions route` | `session.group.subjectId` | Prisma where | ✓ WIRED | route.test.ts |

### Трассировка данных (Level 4)

| Артефакт | Переменная | Источник | Реальные данные | Статус |
|----------|------------|----------|-----------------|--------|
| `analytics/page.tsx` | `topStudents`, `levelStats`, `atRiskStudents` | Prisma через query functions с `filterSubjectId` | DB query | ✓ FLOWING |
| `TopStudents` / charts | `data` prop | Server Component fetch | Не hardcoded | ✓ FLOWING |
| `StudentStudyHistoryModal` | `completions` | `useStepCompletions` → API | Фильтр по `subjectId` | ✓ FLOWING |

### Behavioral spot-checks

| Поведение | Команда | Результат | Статус |
|-----------|---------|-----------|--------|
| Unit/API regression (7 файлов) | `pnpm exec vitest run …` (7 test files) | 30/30 passed | ✓ PASS |
| `resolveAnalyticsSubjectFilter` дефолт | vitest `analytics-query.test.ts` | passed | ✓ PASS |
| Prisma subject scope в top/level/at-risk | vitest analytics-queries + load-student-metrics | passed | ✓ PASS |
| step-completions subject filter | vitest `route.test.ts` | passed | ✓ PASS |
| E2E subject picker + history | Playwright | не запускался | ? SKIP |

### Анти-паттерны

| Файл | Строка | Паттерн | Серьёзность | Влияние |
|------|--------|---------|------------|---------|
| — | — | TBD/FIXME/stub | — | Не обнаружено в файлах фазы |

**Замечание (не блокер):** `readAnalyticsSubjectId()` экспортирован, но нигде не вызывается — localStorage используется только на запись. Первый визит без `subjectId` в URL полагается на серверный дефолт (`DEFAULT_QURAN_SUBJECT_ID`), что соответствует D-05.

### Требуется ручная проверка

1. **E2E wave gate** — запустить `pnpm test:e2e -- e2e/analytics-student-history.spec.ts e2e/student-analytics.spec.ts` и убедиться, что все сценарии зелёные.
2. **Role-scoped список** — учитель видит только свои предметы; менеджер — все.
3. **F5 с `subjectId` в URL** — выбранный предмет и метрики сохраняются после перезагрузки.

### Итог

Реализация в кодовой базе **полностью соответствует цели фазы**: селект предмета, URL-scope, role-scoped список, все метрики и история учёбы фильтруются по `subjectId`. Unit/API regression (30 тестов) проходит. Единственный незакрытый пункт — **исполнение E2E** как wave gate плана 14-03; после зелёного Playwright фазу можно считать полностью подтверждённой.

---

_Верифицировано: 2026-07-12T01:32:00+03:00_  
_Верификатор: Claude (gsd-verifier)_
