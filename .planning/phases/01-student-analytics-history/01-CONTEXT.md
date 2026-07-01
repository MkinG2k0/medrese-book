# Phase 1: Student Analytics & History - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза доставляет измеримый прогресс обучения: длительность уроков (таймер), метрики за период, история занятий, прогресс по программе и предупреждения о нарушении нормативов времени и посещаемости. Требования ANLY-01…ANLY-10 из REQUIREMENTS.md.

В scope обсуждения: **норматив времени по уровням** и **система флагов «требует внимания»** (норматив + пропуски). Остальные требования фазы (таймер, история, метрики в портале) — на усмотрение планировщика по ROADMAP, без переопределения в этом CONTEXT.

</domain>

<decisions>
## Implementation Decisions

### Норматив времени (ANLY-07, расширен на все уровни)

- **D-01:** Бюджет норматива — **сумма `Step.hours` пройденных шагов** на текущем уровне ученика (источник «программа», не календарные часы).
- **D-02:** Правило применяется **на каждом уровне**, не только на 1-м: для уровня N лимит = сумма `Step.hours` всех шагов этого уровня (накопительная проверка в рамках уровня).
- **D-03:** Срабатывание — **накопительно по уровню**: фактическое время на пройденных шагах уровня превышает сумму `Step.hours` этих пройденных шагов.
- **D-04:** Фактическое время (до полной зрелости таймера) — **прокси**: `число занятий (Session, с фильтром analytics) × средний Step.hours` пройденных шагов на уровне. После внедрения ANLY-01 планировщик должен предусмотреть миграцию факта на `TeachingSession.durationMinutes` без смены порогов в конфиге.
- **D-05:** Все параметры норматива и порогов отставания — **единый конфигурируемый объект** (один модуль/константа), чтобы менять метрики без правок логики по всему коду. Минимальные поля: источник факта, режим накопления, пороги пропусков, список включённых сигналов.

### Предупреждения об отставании («требует внимания»)

- **D-06:** Сигналы Phase 1: **(1) нарушение норматива времени** + **(2) посещаемость**. Сравнение с когортой уровня и ML — **не в Phase 1**.
- **D-07:** Аудитория: **учитель и менеджер**; в **портале ученика** предупреждения об отставании **не показывать**.
- **D-08:** UI: **оба места** — блок «Требуют внимания» на `/analytics` (с учётом существующего фильтра по преподавателю) **и** badge/индикатор у ученика в списке журнала.
- **D-09:** Посещаемость: флаг при **3+ пропусках (ABSENT) за выбранный месяц** **ИЛИ** **3 пропусках подряд** (любой период). Оба правила в конфиге; любое срабатывание даёт флаг.

### Claude's Discretion

- Точный путь и форма конфиг-объекта (например `src/shared/lib/student-metrics/at-risk-config.ts`) — на планировщике; обязательно экспорт типизированного объекта и использование во всех местах расчёта флагов.
- UX таймера урока (ANLY-01, ANLY-02), детали истории (модалка vs страница), отображение метрик в портале ученика — по ROADMAP и существующим паттернам, без расширения scope at-risk.
- Визуал badge и блока analytics — в UI-SPEC (`/gsd-ui-phase 1`); здесь зафиксированы только места и смысл.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Требования и roadmap
- `.planning/REQUIREMENTS.md` — ANLY-01…ANLY-10, критерии фазы
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, UI hint
- `.planning/PROJECT.md` — core value (вовремя вмешаться при отставании)

### Исследование и архитектура
- `.planning/research/SUMMARY.md` — открытый вопрос 48ч (закрыт решениями D-01…D-04), модуль `student-metrics`
- `.planning/research/ARCHITECTURE.md` — `shared/lib/student-metrics/`, badge в журнале
- `.planning/research/FEATURES.md` — anti-features (ML at-risk), сравнение с когортой (отложено)

### Кодовая база
- `.planning/codebase/ARCHITECTURE.md` — dual data-access, journal flow
- `prisma/schema.prisma` — `Step.hours`, `Session`, `TeachingSession`
- `src/shared/lib/analytics-queries/filters.ts` — FND-01 / ANLY-10 exclusion
- `src/shared/lib/analytics-queries/top-students.ts` — месячная аналитика, пропуски
- `src/features/journal/lib/teaching-session.ts` — DTO таймера, durationMinutes
- `src/features/analytics/ui/TopStudents.tsx` — drill-down в историю
- `src/features/analytics/ui/StudentStudyHistoryModal.tsx` — существующая история

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TeachingSession` + `serializeTeachingSession` — основа для ANLY-01 и будущей замены прокси фактического времени (D-04).
- `analytics-queries/filters` — единый фильтр сессий/completions (без adjustment и prior credit).
- `TopStudents` + `StudentStudyHistoryModal` — паттерн analytics → детализация по ученику.
- `formatMinutesAsHours`, `formatTeachingSessionDurationLabel` — форматирование времени в UI.

### Established Patterns
- Месячный picker на `/analytics` — период для агрегатов.
- Server actions + Prisma для SSR; React Query для клиентских списков.
- Ant Design Table/Tag/Modal; без переопределения цветов antd (`.cursor/rules/antd-no-style-overrides.mdc`).

### Integration Points
- `/analytics` — новый блок «Требуют внимания» рядом с TopStudents/LevelStats.
- `/journal` — `StudentList` / список группы — badge по `studentId`.
- `shared/lib/student-metrics/` (новый) — расчёт DTO метрик и `riskFlags[]` для UI и API.

</code_context>

<specifics>
## Specific Ideas

- Параметры норматива и порогов — **вынести в один объект**, чтобы «быстро поменять метрики» без рефакторинга по фичам.
- Список отстающих — практическая реализация идеи «найти отстающих учеников» в рамках Phase 1 (не отдельная фаза).
- Прокси «занятия × средний Step.hours» — осознанный компромисс до стабильного таймера; миграция на таймер не должна ломать конфиг порогов.

</specifics>

<deferred>
## Deferred Ideas

- **Сравнение с когортой уровня** (медиана шагов/балла) — обсуждалось как идея; в Phase 1 не включается (D-06). Возможное расширение Phase 1+ или аналитики Phase 7.
- **ML / predictive at-risk** — anti-feature по FEATURES.md.
- **Уведомления NOTF-03** (push/in-app при нормативе) — Phase 6/9; в Phase 1 только визуальные флаги в UI.
- **Портал ученика: видимость предупреждений** — явно исключено (D-07).

</deferred>

---

*Phase: 01-student-analytics-history*
*Context gathered: 2026-07-01*
