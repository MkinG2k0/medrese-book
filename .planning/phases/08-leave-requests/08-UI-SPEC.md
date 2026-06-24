---
phase: 8
slug: leave-requests
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-25
---

# Phase 8 — UI Design Contract: Отпуска, отгулы и больничные

> Визуальный и интерактивный контракт для фазы заявок на отсутствие. Источники: `08-CONTEXT.md`, `ROADMAP.md`, `REQUIREMENTS.md` (LEAV-01…04, TCHR-01,03…05), существующие паттерны Ant Design + Tailwind.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (shadcn не используется; `components.json` отсутствует) |
| Preset | not applicable |
| Component library | Ant Design 6.4 (`ConfigProvider` + `theme.darkAlgorithm`, locale `ru_RU`) |
| Icon library | `@ant-design/icons` |
| Font | Mulish (`--font-body`, body), Cormorant Garamond (`--font-display`, логотип sidebar) |
| Layout | Tailwind flex/grid на `div`; **не** использовать `Flex` из antd |
| Style overrides | **Запрещены** точечные цвета/типографика на antd-компонентах; layout-only Tailwind (`block`, `gap-*`, `w-full`) |

---

## Spacing Scale

Стандартная 8-point шкала проекта (как в `TeacherLessonsAnalytics`, `StudentList`):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon gap |
| sm | 8px | Компактные кнопки в toolbar |
| md | 16px | `gap-4` — между блоками страницы, поля формы |
| lg | 24px | `gap-6` — между календарём и гридом |
| xl | 32px | Внутренние отступы модалки |
| 2xl | 48px | — |
| 3xl | 64px | — |

**Exceptions:** минимальная высота touch-target кнопок действий в гриде — 32px (`size="small"` antd Button, ≥ sm по высоте).

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body | 16px | 400 | 1.5 | `Text`, ячейки таблицы, описания |
| Label | 14px | 400 | 1.5 | Подписи полей Form, вторичный текст `Text type="secondary"` |
| Heading | 20px | 600 | 1.2 | `Title level={3}` — заголовок страницы |
| Display | 28px | 600 | 1.2 | `Title level={2}` — только если нужен hero (не используется в этой фазе) |

**Weights:** только 400 (regular) и 600 (semibold через `Title` / `strong`).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0D1117` | `body` background, основная поверхность Content |
| Secondary (30%) | `#161412` (header), `#12100e` (sidebar), antd dark card/table | Карточки, sidebar, header |
| Accent (10%) | `#f07d00` (`--color-brand-500`) | **Только** primary CTA: «Создать отпуск», «Создать отгул», «Создать больничный», «Подтвердить заявку» |
| Destructive | antd `danger` / `type="danger"` | Кнопка «Отклонить», подтверждение отклонения |

**Accent reserved for:** кнопки создания заявки (teacher), кнопка «Подтвердить» в модалке согласования (manager). Не использовать accent для фильтров, Tag, календарных меток.

**Статусы заявок (Tag + календарь):**

| Статус | Tag | Календарь (badge в `cellRender`) |
|--------|-----|----------------------------------|
| СОЗДАНА | `<Tag color="default">Создана</Tag>` | фон badge: `bg-neutral-600/40`, текст `text-neutral-300` |
| ПОДТВЕРЖДЕНА | `<Tag color="success">Подтверждена</Tag>` | фон badge: `bg-green-700/50`, текст `text-green-200` |
| ОТКЛОНЕНА | `<Tag color="error">Отклонена</Tag>` | **не на календаре**; только в гриде |

**Типы заявок (Tag, без кастомных hex на antd):**

| Тип | Tag |
|-----|-----|
| Отпуск | `<Tag color="blue">Отпуск</Tag>` |
| Отгул | `<Tag color="orange">Отгул</Tag>` |
| Больничный | `<Tag color="purple">Больничный</Tag>` |

Цвета badge календаря — только на HTML-обёртках (`div`/`span`) внутри `cellRender`, не на antd `Tag`.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (teacher) | «Создать отпуск» / «Создать отгул» / «Создать больничный» |
| Primary CTA (manager approve) | «Подтвердить заявку» |
| Empty state heading (teacher calendar) | «Заявок пока нет» |
| Empty state body (teacher) | «Создайте отпуск, отгул или больничный — заявка появится здесь после отправки.» |
| Empty state heading (manager calendar) | «Нет заявок в этом месяце» |
| Empty state body (manager calendar) | «Новые заявки отображаются серым; после подтверждения — зелёным.» |
| Empty state (manager grid) | «Заявки не найдены. Измените фильтры или дождитесь новых заявок от преподавателей.» |
| Error state (submit) | «Не удалось сохранить заявку. Проверьте даты и описание и попробуйте снова.» |
| Error state (load) | «Не удалось загрузить заявки. Обновите страницу.» |
| Success (create) | «Заявка отправлена на согласование» |
| Success (approve) | «Заявка подтверждена, замещение активировано» |
| Success (reject) | «Заявка отклонена» |
| Destructive confirmation | **Отклонить заявку:** «Укажите причину отклонения — преподаватель увидит её в уведомлении.» |
| Notification (substitute, Phase 6) | «Вы замещаете {ФИО} с {дата} по {дата}» |
| Modal title (create vacation) | «Новый отпуск» |
| Modal title (create day off) | «Новый отгул» |
| Modal title (create sick) | «Новый больничный» |
| Modal title (approve) | «Подтвердить заявку» |
| Modal title (reject) | «Отклонить заявку» |
| Field label — dates | «Период отсутствия» |
| Field label — description | «Описание» |
| Field placeholder — description | «Причина или комментарий для менеджера» |
| Field label — reject reason | «Причина отклонения» |
| Field placeholder — reject reason | «Например: в этот период нет замены» |
| Field label — substitute | «Замещающий преподаватель» |
| Field placeholder — substitute | «Выберите преподавателя» |
| Submit (create modal) | «Отправить заявку» |
| Cancel (all modals) | «Отмена» |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| — | — | not applicable (shadcn не инициализирован) |

---

## Resolved Open Questions (defaults for planner)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Больничный — отдельный тип? | **Да**, третий тип `SICK_LEAVE` + кнопка «Создать больничный» | Отдельный audit trail; LEAV-05 в roadmap; та же модалка, другой `type` |
| Один замещающий vs по дням? | **Один замещающий на весь диапазон** | LEAV-04, TCHR-03; per-day — out of scope |
| Календарь учителя — только свои? | **Да**, teacher видит только свои заявки | Приватность; manager — все |
| Авто-отмена замещения? | **Да**, замещение деактивируется после `endDate` (конец дня) | TCHR-03 «ограничение по сроку»; UI не требует ручного снятия |

---

## Pages & Routes

| Route | Роли | Nav label (AppShell) | Icon |
|-------|------|----------------------|------|
| `/calendar` | `TEACHER` | «Календарь» | `CalendarOutlined` |
| `/admin/leave-calendar` | `MANAGER`, `SUPER_ADMIN` | «Календарь отпусков» | `CalendarOutlined` |

**Размещение в меню:** после «Моя группа» (teacher) и после «Аналитика учителей» (manager) — см. паттерн `allMenuItems` в `AppShell.tsx`.

**Guard:** `requireRole('TEACHER')` / `requireRoles(['MANAGER','SUPER_ADMIN'])`; остальные роли — redirect или `notFound`.

**Структура страниц (общий layout):**

```
div.flex.flex-col.gap-6
├── header: Title level={3} + toolbar (кнопки / фильтры)
├── Calendar (month view)
└── [manager only] LeaveRequestsTable + filters
```

Teacher page **без** грида — только календарь + 3 кнопки создания. Список заявок teacher читает с календаря (клик по событию → read-only Modal с деталями).

---

## Calendar Component

| Property | Value |
|----------|-------|
| Component | `Calendar` из `antd` |
| Mode | `month`, `fullscreen={false}` |
| Navigation | встроенная смена месяца antd Calendar |
| Data binding | заявки с `startDate`…`endDate`; каждый день диапазона получает badge |
| cellRender | кастомные badge на `div` (Tailwind), max 3 на ячейку + «+N» |
| Teacher cell content | тип + статус (кратко: «Отпуск · Создана») |
| Manager cell content | фамилия преподавателя (сокращённо) + цвет по статусу |
| Click | открывает Modal деталей (teacher: read-only; manager: read-only + actions если CREATED) |
| Legend | под календарём: два пункта — «Создана» (серый swatch), «Подтверждена» (зелёный swatch) |

**Не использовать:** сторонние calendar-библиотеки, `@fullcalendar/*`, shadcn calendar.

**DatePicker в модалках создания:** `DatePicker.RangePicker` — паттерн из `TeacherLessonsDateFilter.tsx`:
- `format="DD.MM.YYYY"`
- `allowClear={false}`
- `disabledDate`: запрет прошлых дат **не** применять (отпуск может планироваться заранее); запрет только невалидных дат
- min range: 1 день (`start === end` допустимо для отгула)

---

## Modal Forms

### 1. CreateLeaveModal (teacher)

| Field | Component | Validation |
|-------|-----------|------------|
| Период | `RangePicker` | required; `end >= start` |
| Описание | `Input.TextArea`, `rows={3}`, `maxLength={500}`, `showCount` | required, min 2 символа |

- **Props:** `leaveType: 'VACATION' | 'DAY_OFF' | 'SICK_LEAVE'`
- **Trigger:** одна из трёх кнопок `type="primary"` в toolbar
- **Form:** react-hook-form + zod (как `UserDetailModal`)
- **Footer:** «Отмена» (`default`) + «Отправить заявку» (`primary`, `loading` on submit)
- **On success:** `message.success`, закрыть модалку, invalidate queries, статус `CREATED`

### 2. ApproveLeaveModal (manager)

| Field | Component | Validation |
|-------|-----------|------------|
| Замещающий | `Select` + `showSearch` + `optionFilterProp="label"` | required; exclude заявителя и не-TEACHER |
| Summary | `Descriptions` read-only | ФИО, тип, период, описание |

- **Footer:** «Отмена» + «Подтвердить заявку» (`primary`)
- Один substitute на весь период (без per-day UI)

### 3. RejectLeaveModal (manager)

| Field | Component | Validation |
|-------|-----------|------------|
| Причина | `Input.TextArea`, `rows={3}`, `maxLength={500}` | required, min 5 символов |

- **Footer:** «Отмена» + «Отклонить» (`danger`)
- Без `Modal.confirm` без поля — причина обязательна в форме

### 4. LeaveDetailModal (read-only)

- Teacher: статус, тип, период, описание; если `REJECTED` — показать `rejectionReason`
- Manager: то же + кнопки «Подтвердить» / «Отклонить» только при `CREATED`

**Общие правила модалок:**
- `destroyOnClose`
- `width={480}` (create/reject), `width={560}` (approve with Descriptions)
- Scope E2E: `getByRole('dialog', { name: '…' })`

---

## Manager Grid (LeaveRequestsTable)

**Расположение:** под календарём, `gap-6` от календаря.

**Фильтры (toolbar над таблицей):**

| Filter | Component | Default |
|--------|-----------|---------|
| Статус | `Select` | «Все» |
| Преподаватель | `Select` + search | «Все» |
| Тип | `Select` | «Все» |
| Период | `RangePicker` (optional) | пусто = без фильтра по датам |

**Columns:**

| Column | Key | Render |
|--------|-----|--------|
| Преподаватель | `teacherName` | text |
| Тип | `type` | Tag по типу |
| Период | `startDate`, `endDate` | `DD.MM.YYYY — DD.MM.YYYY` |
| Статус | `status` | Tag по статусу |
| Описание | `description` | ellipsis 40 chars, `Tooltip` full text |
| Замещающий | `substituteName` | text или «—» |
| Действия | `actions` | только `CREATED`: «Подтвердить» (`link`/`primary`), «Отклонить» (`link danger`) |

**Table props:** `rowKey="id"`, `pagination={{ pageSize: 20 }}`, сортировка по `createdAt` desc default.

**Rejected rows:** видны в гриде с фильтром «Отклонена»; колонка «Причина отклонения» показывается при фильтре статуса «Отклонена» или в детальной модалке.

---

## Role Visibility Matrix

| Capability | TEACHER | MANAGER | SUPER_ADMIN | STUDENT |
|------------|---------|---------|-------------|---------|
| `/calendar` | ✓ own | — | — | — |
| `/admin/leave-calendar` | — | ✓ | ✓ | — |
| Создать заявку | ✓ | — | — | — |
| Видеть всех преподавателей | — | ✓ | ✓ | — |
| Approve / Reject | — | ✓ | ✓ | — |
| UserSwitcher → замещаемый | ✓ если active substitution | ✓* | ✓* | — |
| In-app notification | ✓ | ✓ | ✓ | — |

\* Manager switch — существующее поведение Phase 4; не часть этой фазы.

---

## Notifications & UserSwitcher (integration)

- **Phase 6 dependency:** колокольчик в Header (не реализуется в Phase 8, но UI copy зафиксирован).
- События: новая заявка → manager; решение → teacher; назначение замещения → substitute.
- **UserSwitcher:** после approve substitute видит замещаемого в списке (backend Phase 4); подпись в dropdown без изменения UI-компонента — только данные `switchableUsers`.

---

## Component Inventory (reuse)

| Need | Use |
|------|-----|
| Page title | `Title` from `@/shared/ui/Title` |
| Body text | `Text` from `@/shared/ui/Text` |
| Date range filter | паттерн `TeacherLessonsDateFilter` |
| Teacher select | паттерн `TeacherLessonsPicker` / `UsersTable` Select |
| Forms | react-hook-form + zod + antd `Form.Item` / `Controller` |
| Feedback | `App.useApp().message` (antd `App` wrapper уже в provider) |
| Loading | `Table` loading prop; `Spin` в calendar при первой загрузке |

**New feature module:** `src/features/leave-requests/` — `ui/`, `actions/`, `model/`, `lib/`.

---

## Accessibility & E2E

- Все интерактивные элементы — `aria-label` или visible text на русском.
- Dialog names = modal titles из copywriting contract.
- E2E spec: `e2e/leave-requests.spec.ts` — teacher create, manager approve with substitute, manager reject with reason, calendar colors smoke.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
