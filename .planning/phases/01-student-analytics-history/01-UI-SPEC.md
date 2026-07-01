---
phase: 1
slug: student-analytics-history
status: approved
reviewed_at: 2026-07-01
shadcn_initialized: false
preset: none
created: 2026-07-01
---

# Phase 1 — UI Design Contract: Аналитика и история ученика

> Визуальный и интерактивный контракт для фазы метрик, таймера урока, истории и предупреждений об отставании. Источники: `01-CONTEXT.md` (D-01…D-09), `ROADMAP.md` Phase 1, `REQUIREMENTS.md` (ANLY-01…ANLY-10), существующие паттерны Ant Design 6 + Tailwind.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (shadcn не используется; `components.json` отсутствует) |
| Preset | not applicable |
| Component library | Ant Design 6.4 (`ConfigProvider` + `theme.darkAlgorithm`, locale `ru_RU`) |
| Icon library | `@ant-design/icons` |
| Font | Mulish (`--font-body`, body), Cormorant Garamond (`--font-display`, логотип sidebar), Amiri — только арабский контент программы |
| Layout | Tailwind flex/grid на `div`; **не** использовать `Flex` из antd |
| Style overrides | **Запрещены** точечные цвета/типографика на antd-компонентах; layout-only Tailwind (`block`, `gap-*`, `w-full`) — см. `.cursor/rules/antd-no-style-overrides.mdc` |
| Charts | Recharts (как `TopStudents`, `LevelStats`) — только для существующих графиков; at-risk блок без графика |
| Time formatting | `formatMinutesAsHours`, `formatElapsedMs`, `formatTeachingSessionDurationLabel` |

---

## Spacing Scale

Стандартная 8-point шкала проекта (как Phase 8, `analytics/page.tsx`, `StudentList`):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon gap, badge рядом с именем |
| sm | 8px | Компактные элементы в toolbar |
| md | 16px | `gap-4` — между блоками страницы, поля фильтров |
| lg | 24px | `gap-6` — между секциями портала ученика |
| xl | 32px | `gap-8` — между крупными блоками `/analytics` |
| 2xl | 48px | — |
| 3xl | 64px | — |

**Exceptions:** минимальная touch-target кнопок таймера — `Button` default height (≥ 32px); иконка badge в журнале — 16×16px с `aria-label`.

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body | 16px | 400 | 1.5 | `Text`, ячейки таблицы, подписи метрик |
| Label | 14px | 400 | 1.5 | `Text type="secondary"`, подписи `Statistic`, вторичный текст |
| Heading | 20px | 600 | 1.2 | `Title level={3}` — заголовок страницы |
| Section | 18px | 600 | 1.2 | `Title level={4}` — «Требуют внимания», «Топ учеников» |

**Weights:** только 400 (regular) и 600 (semibold через `Title` / `Text strong`).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0D1117` | `body` background, основная поверхность Content |
| Secondary (30%) | `#161412` (header), `#12100e` (sidebar), antd dark card/table | Карточки, sidebar, header, обёртки layout (`div` с Tailwind border/bg — допустимо на HTML, не на antd) |
| Accent (10%) | `#f07d00` (`--color-brand-500`) | **Только** primary CTA: «Начать урок» в `LessonTimerBar` |
| Destructive | antd `danger` | «Закончить урок» (`Button danger`) |

**Accent reserved for:** кнопка «Начать урок» (`type="primary"`). Не использовать accent для Tag, фильтров, badge риска, метрик, графиков.

### Флаги риска (Tag — только semantic props antd)

| Сигнал | Tag | Tooltip (на `Tag` или обёртке) |
|--------|-----|--------------------------------|
| Нарушение норматива времени (`TIME_NORM`) | `<Tag color="warning">Норматив</Tag>` | «Превышен норматив времени» |
| Посещаемость (`ATTENDANCE`) | `<Tag color="error">Пропуски</Tag>` | «Много пропусков» |
| Оба сигнала | оба Tag в ряд, `gap-1` | оба tooltip по hover |

**Не использовать** кастомные hex на `Tag`, `Alert`, `Badge` antd. Для иконки в журнале — `WarningOutlined` с `className="text-warning"` **запрещено**; использовать `<Badge status="warning" />` или `<Badge status="error" />` antd, либо `Tag color="warning"` compact в ячейке.

### Предупреждение о нормативе (урок / карточка прогресса)

| Контекст | Component | Props |
|----------|-----------|-------|
| Страница урока ученика (teacher) | `Alert` | `type="warning"`, `showIcon`, **без** кастомного `style` |
| Портал ученика — прогресс | **не показывать** at-risk (D-07); опционально нейтральный `Text type="secondary"` о фактическом времени без слова «нарушение» |

### Посещаемость (существующий паттерн — сохранить)

| Статус | Tag |
|--------|-----|
| PRESENT | `color="green"` «Пришёл» |
| LATE | `color="orange"` «Опоздал» |
| ABSENT | `color="red"` «Прогул» / «Не пришёл» (портал) |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (timer) | «Начать урок» |
| Secondary CTA (timer) | «Закончить урок» |
| Block title (at-risk) | «Требуют внимания» |
| Block subtitle (at-risk) | «За {monthLabel}» (вторичный `Text`, под заголовком) |
| Empty state heading (at-risk) | «Все ученики в норме» |
| Empty state body (at-risk) | «Все ученики в норме за {monthLabel}» |
| Error state (at-risk load) | «Не удалось загрузить список. Обновите страницу.» |
| Error state (timer start) | «Не удалось начать урок. Попробуйте ещё раз.» |
| Error state (timer end) | «Не удалось завершить урок. Попробуйте ещё раз.» |
| Success (timer start) | «Урок начат» |
| Success (timer end) | «Урок завершён» |
| Badge tooltip — norm | «Превышен норматив времени» |
| Badge tooltip — attendance | «Много пропусков» |
| Badge tooltip — both | «Превышен норматив времени; много пропусков» |
| Norm alert (lesson page) | «Превышен норматив времени на текущем уровне» |
| Norm alert description | «Фактическое время обучения больше суммы часов пройденных шагов программы. Обсудите с учеником план нагрузки.» |
| Modal title (history) | «История учёбы — {studentName}» |
| History empty | «Нет пройденных шагов» |
| History empty (sessions) | «Нет занятий за выбранный период» |
| Metrics label — lessons | «Уроков» |
| Metrics label — steps | «Шагов» |
| Metrics label — time | «Время обучения» |
| Metrics period hint | «За {monthLabel}» / «За период» (портал — текущий месяц по умолчанию) |
| Timer status — active | «Урок идёт» |
| Timer status — ended today | «Урок завершён» |
| Timer status — ended past | «Урок проведён» |
| Timer status — not started | «Урок не начат» |
| Timer status — past no data | «Урок» |
| Timer subtitle — active | «Длительность: {elapsed}» (формат `M:SS` или `H:MM:SS` через `formatElapsedMs`) |
| Timer subtitle — ended | «Длительность: {duration}» |
| Timer subtitle — no data past | «Время не учтено» |
| Timer subtitle — today not started | «Нажмите «Начать урок», чтобы открыть журнал учеников» |
| Timer loading | «Загрузка статуса урока...» |
| Journal blocked overlay | «Сначала нажмите «Начать урок», чтобы открыть список учеников» |
| History column — duration | «Длительность занятия» |
| History duration missing | «—» |
| Progress label (portal) | «Прогресс: шаг {current} из {total}» |
| Destructive confirmation | **не применимо** в Phase 1 (таймер end — без confirm; мгновенное действие) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| — | — | not applicable (shadcn не инициализирован) |

---

## Resolved Open Questions (defaults for planner)

| Question | Decision | Rationale |
|----------|----------|-----------|
| At-risk на `/analytics` — таблица или список? | **Table** (как `TopStudents`) | Единообразие analytics; клик по строке → история |
| Порядок блоков на `/analytics`? | **AtRisk → TopStudents → LevelStats** | Приоритет вмешательства (D-08, core value) |
| Drill-down из at-risk? | **Тот же `StudentStudyHistoryModal`** | Переиспользование `TopStudents` паттерна |
| Badge в журнале — где? | Колонка «Ученик», после имени (inline) | Не ломать существующие колонки; видно при сканировании |
| Кто видит badge? | **TEACHER, MANAGER** (не STUDENT) | D-07, D-08 |
| Метрики в портале — где? | **`/student/me`** — ряд `Statistic`/`Card`; период = календарный месяц | ANLY-03…05; at-risk скрыт |
| История портала vs modal? | Портал: `/student/history` таблица; teacher/manager: modal + опционально та же таблица с duration | ANLY-08/09 |
| Группировка истории по занятию? | **Одна строка на шаг**; колонка «Длительность занятия» дублируется на строках одной даты (как attendance) | Минимальный diff от текущей modal |
| Norm warning на уроке? | `Alert type="warning"` над шагами, если `riskFlags` содержит `TIME_NORM` | ANLY-07, видимость teacher |
| Прокси vs таймер в UI? | Показывать **фактическое отформатированное время**; не раскрывать «прокси» в copy | D-04 — внутренняя реализация |
| Recharts цвета | Оставить существующие hex **только в SVG Recharts** (не antd) | Уже в `TopStudents`/`LevelStats` |

---

## Pages & Routes

| Route | Роли | Nav label | Изменения Phase 1 |
|-------|------|-----------|-------------------|
| `/analytics` | `TEACHER`, `MANAGER`, `SUPER_ADMIN` | «Аналитика» | + блок `AtRiskStudentsTable`; фильтры month/teacher без изменений |
| `/journal` | `TEACHER` | «Моя группа» | `LessonTimerBar` (есть); `JournalStudentsTable` + `JournalRiskBadge` |
| `/journal/[studentId]` | `TEACHER` | — | norm `Alert` при нарушении; метрики периода опционально в шапке урока |
| `/student/me` | `STUDENT` | «Мой прогресс» | + `StudentMetricsCards` (уроки, шаги, время); **без** at-risk |
| `/student/history` | `STUDENT` | «История» | + колонка длительности занятия |
| `/student/lessons` | `STUDENT` | «Мои уроки» | при необходимости — длительность в списке |

**Guard:** существующие `requireRole` / `requireRoles`; at-risk данные не отдавать STUDENT API.

**Focal points (visual hierarchy):**

| Экран | Focal point | Порядок внимания |
|-------|-------------|------------------|
| `/analytics` | `AtRiskStudentsTable` — первый якорь под фильтрами | At-risk → TopStudents → LevelStats |
| `/journal` | `LessonTimerBar` над списком учеников | Timer → AttendanceFilter → таблица с badge |

**Структура `/analytics`:**

```
div.flex.flex-col.gap-8
├── header: Title «Аналитика» + AnalyticsTeacherPicker + AnalyticsMonthPicker
├── AtRiskStudentsTable (NEW) ← focal point
├── TopStudents
└── LevelStatsChart
```

**Структура `/journal` (фрагмент):**

```
div.flex.flex-col.gap-4
├── Title + DatePicker
├── LessonTimerBar
├── AttendanceFilter
└── JournalStudentsTable (+ risk badge column/cell)
```

---

## Component Specs

### 1. AtRiskStudentsTable (NEW)

**Location:** `src/features/analytics/ui/AtRiskStudentsTable.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `data` | `AtRiskStudentRow[]` | SSR с page или client fetch |
| `monthLabel` | `string` | «январь 2026» для empty/subtitle |
| `loading` | `boolean` | optional |

**Row type `AtRiskStudentRow`:**

| Field | UI |
|-------|-----|
| `student.id`, `student.name` | колонка «Ученик» |
| `teacherName` | колонка «Преподаватель» (только если фильтр «Все учителя») |
| `levelTitle` | колонка «Уровень» |
| `riskFlags` | колонка «Сигналы» — Tag по таблице цветов выше |
| `absencesInMonth` | колонка «Пропуски» (число) |
| `actualTimeLabel` | колонка «Время» — `formatMinutesAsHours` |
| `normBudgetLabel` | колонка «Норматив» — `formatMinutesAsHours` |

**Layout:**

```tsx
div.flex.flex-col.gap-4
├── Title level={4} «Требуют внимания»
├── Text type="secondary" «За {monthLabel}»
├── Table | Empty (antd Table locale.emptyText)
└── StudentStudyHistoryModal (shared state on row click)
```

**Table props:** `rowKey={(r) => r.student.id}`, `pagination={{ pageSize: 10, showSizeChanger: false }}`, `onRow` → `cursor-pointer`, open modal.

**Empty:** `data.length === 0` → `locale={{ emptyText: «Все ученики в норме за {monthLabel}» }}` (одна строка, без отдельного `Empty` component).

**Фильтры:** не дублировать — данные уже отфильтрованы server-side по `month` + `teacher` из URL (как `getTopStudents`).

---

### 2. JournalRiskBadge (NEW)

**Location:** `src/features/journal/ui/JournalRiskBadge.tsx`

**Props:**

| Prop | Type |
|------|------|
| `riskFlags` | `('TIME_NORM' \| 'ATTENDANCE')[]` |
| `studentName` | `string` (для aria) |

**Render rules:**

- `riskFlags.length === 0` → `null`
- Один флаг → один `Tag` compact (`bordered={false}` optional) + `Tooltip`
- Два флага → два Tag в `span.flex.gap-1`
- **Не** блокировать клик по строке; `onClick` stopPropagation **не** нужен на badge

**Integration в `JournalStudentsTable`:**

- Расширить `JournalStudentRow`: `riskFlags?: RiskFlag[]`
- В колонке «Ученик»: `flex items-center gap-2` — `StudentNameCell` + `JournalRiskBadge`
- Данные: batch-fetch risk flags для списка `studentId` при загрузке students (hook или SSR prop)

**Visibility:** рендерить только если роль session — TEACHER/MANAGER; parent передаёт `showRiskBadge={boolean}`.

---

### 3. LessonTimerBar (EXISTING — contract)

**Location:** `src/features/journal/ui/LessonTimerBar.tsx` — документировать, не переписывать без ANLY-01 gaps.

| State | UI | Actions |
|-------|-----|---------|
| Loading | `Text type="secondary"` «Загрузка статуса урока...» | — |
| Today, no session | title «Урок не начат»; subtitle CTA hint | `Button type="primary"` «Начать урок» |
| Today, active | title «Урок идёт»; subtitle elapsed tick 1s | `Button danger` «Закончить урок» |
| Today, ended | title «Урок завершён»; subtitle fixed duration | — |
| Past, ended | title «Урок проведён» | — |
| Past, no session | title «Урок»; subtitle «Время не учтено» | — |

**Wrapper:** `div` с Tailwind border/bg (`border-[#2a2622] bg-[#1a1714]`) — layout HTML, допустимо.

**Icons:** `PlayCircleOutlined`, `StopOutlined`.

**Data:** `useTeachingSession(groupId, date)`; mutations `useStartTeachingSession`, `useEndTeachingSession`.

**ANLY-01/02 acceptance:** elapsed виден в subtitle при active; после end — сохранённая длительность в subtitle.

---

### 4. StudentMetricsCards (NEW)

**Location:** `src/features/analytics/ui/StudentMetricsCards.tsx` (или `student-portal/ui/` если только портал)

**Pattern:** три `Card` в `div.grid.grid-cols-1.sm:grid-cols-3.gap-4` **или** `Row`/`Col` через Tailwind grid на `div` (не `Flex` antd).

**Каждая карточка:**

| Метрика | Заголовок | Значение | Источник |
|---------|-----------|----------|----------|
| ANLY-03 | «Уроков» | целое число | sessions count за период |
| ANLY-04 | «Шагов» | целое число | completions без prior credit |
| ANLY-05 | «Время обучения» | `formatMinutesAsHours(totalMinutes)` | sum `TeachingSession.durationMinutes` или прокси до миграции |

**Подпись периода:** `Text type="secondary"` «За {monthLabel}» над grid или в заголовке секции.

**Размещение:**

- `/analytics` — **не** добавлять (метрики агрегированы в таблицах); опционально summary row только если planner добавит manager dashboard later
- `/student/me` — под `ProgressBar`
- `/journal/[studentId]` — компактный вариант (3 `Statistic` в один ряд) под именем ученика для teacher

**Card props:** antd `Card` без кастомных `className` цветов; size `small` допустим.

---

### 5. StudentStudyHistoryModal — timeline entries (EXTEND)

**Location:** `src/features/analytics/ui/StudentStudyHistoryModal.tsx`

**Changes Phase 1 (ANLY-08, ANLY-09):**

| Column | Key | Render |
|--------|-----|--------|
| Шаг | `step` | без изменений |
| Оценка | `grade` | без изменений |
| Заметка | `note` | без изменений |
| Дата занятия | `sessionDate` | `formatDate` |
| Посещаемость | `attendance` | Tag |
| **Длительность занятия** | `sessionDuration` | **NEW** — `formatTeachingSessionDurationLabel(session)` или `formatMinutesAsHours(durationMinutes)`; «—» если нет данных |

**Optional enhancement (planner discretion):** prop `groupBySession?: boolean` — если false (default), flat table как сейчас.

**Modal:** `width={800}`, `footer={null}`, `destroyOnHidden`, title из copywriting.

**Student portal mirror:** `StudentSessionsTable` — добавить колонку «Длительность» с тем же форматированием.

**Data:** API/step-completions или sessions endpoint должен включить `session.durationMinutes` / teaching session DTO.

---

### 6. NormWarningAlert (NEW, optional extract)

**Location:** `src/features/journal/ui/NormWarningAlert.tsx` или inline в lesson page

| Prop | Type |
|------|------|
| `visible` | `boolean` — `riskFlags.includes('TIME_NORM')` |
| `levelTitle` | `string` optional |

```tsx
<Alert
  type="warning"
  showIcon
  message="Превышен норматив времени на текущем уровне"
  description="Фактическое время обучения больше суммы часов пройденных шагов программы. Обсудите с учеником план нагрузки."
/>
```

**Placement:** `journal/[studentId]` lesson page, над `LessonStepsSection`, `className="mb-4"` (layout-only).

**Не показывать** на `/student/*` (D-07).

---

## Role Visibility Matrix

| Capability | TEACHER | MANAGER | SUPER_ADMIN | STUDENT |
|------------|---------|---------|-------------|---------|
| `/analytics` at-risk block | ✓ | ✓ | ✓ | — |
| Journal risk badge | ✓ | ✓* | ✓* | — |
| Lesson timer start/end | ✓ | —** | —** | — |
| Metrics (lessons/steps/time) | ✓ lesson header | ✓ analytics tables | ✓ | ✓ portal `/student/me` |
| Norm alert on lesson | ✓ | ✓* | ✓* | — |
| History with duration | ✓ modal | ✓ modal | ✓ modal | ✓ `/student/history` |
| At-risk copy/tooltips | ✓ | ✓ | ✓ | **скрыто** |

\* Manager viewing journal — если есть маршрут; badge данные те же API.  
\** Timer только в teacher journal flow; manager не ведёт урок группы.

---

## Component Inventory (reuse)

| Need | Use |
|------|-----|
| Page title | `Title` from `@/shared/ui/Title` |
| Body text | `Text` from `@/shared/ui/Text` |
| Month filter | `AnalyticsMonthPicker` |
| Teacher filter | `AnalyticsTeacherPicker` |
| History modal | `StudentStudyHistoryModal` (extend) |
| Timer | `LessonTimerBar` (existing) |
| Progress bar | `ProgressBar` (`/student/me`) |
| Time format | `formatMinutesAsHours`, `formatElapsedMs`, `formatTeachingSessionDurationLabel` |
| Feedback | `App.useApp().message` |
| Tooltips | antd `Tooltip` |
| Loading | `Table` `loading`; `Spin` при первой загрузке metrics |

**New module paths:**

- `src/features/analytics/ui/AtRiskStudentsTable.tsx`
- `src/features/analytics/ui/StudentMetricsCards.tsx` (или split portal/analytics)
- `src/features/journal/ui/JournalRiskBadge.tsx`
- `src/features/journal/ui/NormWarningAlert.tsx`
- `src/shared/lib/student-metrics/` — DTO `riskFlags`, не UI

---

## Accessibility & E2E

- Badge: `aria-label="{studentName}: превышен норматив"` / «много пропусков» на иконке или Tag.
- Timer buttons: visible Russian text («Начать урок», «Закончить урок»).
- Modal: `getByRole('dialog', { name: /История учёбы/ })`.
- At-risk row click: keyboard — Table row focusable via antd defaults.
- E2E spec (planner): `e2e/student-analytics.spec.ts` — timer start/end, at-risk row → modal, badge visible for flagged student, portal metrics without at-risk.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-07-01
