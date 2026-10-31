---
phase: 10
slug: subject-foundation
status: approved
shadcn_initialized: false
preset: none
created: 2026-07-07
---

# Phase 10 — UI Design Contract

> Визуальный и интерактивный контракт для админки предметов и редактора программы. Brownfield: Ant Design 6 + существующие паттерны `groups` и `program-admin`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **Ant Design 6** (не shadcn) |
| Preset | not applicable |
| Component library | antd (`Table`, `Form`, `Modal`, `Button`, `Input`, `Tag`) |
| Icon library | `@ant-design/icons` (только при необходимости; фаза 10 — минимум иконок) |
| Font | Mulish (app layout), арабский — Amiri в редакторе шагов (без изменений) |
| Theme | `theme.darkAlgorithm` через `ConfigProvider` — **не переопределять** цвета Tailwind на antd-компонентах |
| Layout | `div` + Tailwind flex/gap (без `<Flex>` из antd) |
| Modals | `App.useApp().modal.confirm` для деструктивных действий; `<Modal>` для create/edit форм |

---

## Screens & Navigation

### Маршруты (замена `/admin/program`)

| Маршрут | Экран | Референс |
|---------|-------|----------|
| `/admin/subjects` | Список предметов | `GroupsList` |
| `/admin/subjects/[subjectId]/program` | Уровни предмета | `admin/program/page.tsx` |
| `/admin/subjects/[subjectId]/program/[levelId]` | Шаги уровня | `admin/program/[levelId]/page.tsx` |
| `/admin/subjects/[subjectId]/program/[levelId]/steps/new` | Новый шаг | существующий `StepForm` |
| `/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit` | Редактирование шага | существующий `StepForm` |

### AppShell

- Пункт меню: **«Предметы»**, key `/admin/subjects`, роли MANAGER + SUPER_ADMIN
- Удалить пункт **«Программа»** (`/admin/program`)

### Breadcrumbs (опционально, рекомендуется)

На страницах программы предмета:

```
Предметы → {название предмета} → {название уровня}
```

Реализация: `Breadcrumb` antd или текстовые ссылки — на усмотрение executor, но иерархия обязательна.

---

## Screen Contracts

### 1. Список предметов (`/admin/subjects`)

**Focal point:** таблица предметов.

**Layout:**
- `flex flex-col gap-4` (16px между секциями)
- Шапка: `Title level={3}` «Предметы» слева; `Button type="primary"` «Создать предмет» справа

**Table columns:**

| Колонка | Содержание |
|---------|------------|
| Название | Ссылка на `/admin/subjects/{id}/program` |
| Описание | Обрезка до 1 строки; `type="secondary"` Text если пусто — «—» |
| Уровней | Tag с числом уровней |
| Шагов | Tag с суммой шагов (или «—» если 0) |
| Действия | «Редактировать» (small); «Удалить» (small, danger) |

**Пустое состояние:** если предметов нет — только заголовок + CTA «Создать предмет»; под таблицей `Empty` antd не обязателен, достаточно пустой таблицы + поясняющий `Text type="secondary"` под шапкой.

### 2. Модалка создания/редактирования предмета

**Pattern:** как `GroupsList` + `CreateGroupForm` — `<Modal footer={null} destroyOnHidden>`.

**Поля:**
- Название — `Input`, обязательное, min 2 символа
- Описание — `Input.TextArea`, опциональное, rows={3}

**CTA submit:** «Создать предмет» / «Сохранить изменения»

### 3. Удаление предмета

**Условие:** только если у предмета **0 уровней** (и 0 шагов).

**Если есть уровни:** `message.error` — «Нельзя удалить предмет с программой. Сначала удалите все уровни.»

**Если можно удалить:** `modal.confirm`:
- title: «Удалить предмет?»
- content: «Предмет «{name}» будет удалён безвозвратно.»
- okText: «Удалить», okType: `danger`
- cancelText: «Отмена»

### 4. Программа предмета (`/admin/subjects/[subjectId]/program`)

**Focal point:** таблица уровней.

**Layout:** как текущая «Программа обучения», но заголовок: `Title level={3}` — **«{название предмета}»** (не «Программа обучения»).

**CTA:** `Button type="primary"` «Новый уровень» → модалка или отдельная страница (как сейчас для уровней — executor выбирает, но предпочтительно **модалка** для единообразия с предметами, если уже есть edit level flow — сохранить существующий паттерн program-admin).

**Table:** переиспользовать `LevelsTable` с колонками Уровень / Название / Шагов / Действия; ссылки ведут на `/admin/subjects/{subjectId}/program/{levelId}`.

**Пустое состояние:**
- heading: «Программа пока пуста»
- body: «Добавьте первый уровень, чтобы настроить шаги обучения.»
- CTA: «Новый уровень»

### 5. Шаги уровня и редактор шага

**Без изменений UX:** переиспользовать `LevelStepsTable`, `StepForm`, `StepEditor` как есть.

**Заголовок страницы шагов:** `{название уровня}` + кнопки «Редактировать уровень» / «Новый шаг».

**Номер шага:** глобальный номер в скоупе **предмета** (не всей системы) — отображать как сейчас `toGlobalStepNumber`, но offset считается по уровням этого предмета.

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | `gap-2` между кнопками в шапке |
| md | 16px | `gap-4` — основной вертикальный ритм страницы |
| lg | 24px | отступ между крупными блоками (если нужен) |

Exceptions: none — только кратные 4 через Tailwind (`gap-2`, `gap-4`, `gap-6`).

---

## Typography

| Role | Component | Usage |
|------|-----------|-------|
| Page title | `Title level={3}` | «Предметы», название предмета, название уровня |
| Body | `Text` | описания, пустые состояния |
| Secondary | `Text type="secondary"` | пустое описание, подсказки |
| Table headers | antd Table default | не переопределять |

Font sizes: делегированы antd `Title` / `Text` — **не добавлять** `text-sm` / `text-lg` на antd-компоненты.

---

## Color

| Role | Source | Usage |
|------|--------|-------|
| Dominant (60%) | antd dark `colorBgBase` | фон приложения |
| Secondary (30%) | antd `colorBgContainer` | таблицы, модалки |
| Accent (10%) | antd `colorPrimary` | **только** primary CTA: «Создать предмет», «Новый уровень», «Новый шаг», submit в формах |
| Destructive | antd `colorError` + `danger` buttons | «Удалить» предмет, confirm delete |
| Links | antd link color | название предмета в таблице → программа |

Accent reserved for: primary action buttons, активный пункт навигации (AppShell — без изменений в фазе 10).

**Запрещено:** `className="text-[#...]"` на antd `Text`/`Title`/`Button` (см. `.cursor/rules/antd-no-style-overrides.mdc`).

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Nav item | Предметы |
| Page title (list) | Предметы |
| Primary CTA (list) | Создать предмет |
| Modal create title | Создать предмет |
| Modal edit title | Редактировать предмет |
| Submit create | Создать предмет |
| Submit edit | Сохранить изменения |
| Field label name | Название |
| Field label description | Описание |
| Empty program heading | Программа пока пуста |
| Empty program body | Добавьте первый уровень, чтобы настроить шаги обучения. |
| Delete blocked | Нельзя удалить предмет с программой. Сначала удалите все уровни. |
| Delete confirm title | Удалить предмет? |
| Delete confirm body | Предмет «{name}» будет удалён безвозвратно. |
| Delete confirm ok | Удалить |
| Delete confirm cancel | Отмена |
| Not found subject | Предмет не найден |
| Not found level | Уровень не найден |
| Success create | Предмет создан |
| Success update | Изменения сохранены |
| Success delete | Предмет удалён |
| Error generic | Не удалось сохранить. Попробуйте ещё раз. |

---

## Interaction Patterns

| Pattern | Rule |
|---------|------|
| Create/Edit subject | Modal + vertical Form |
| Delete subject | `modal.confirm` через `App.useApp()` |
| List refresh | `router.refresh()` после успешной мутации |
| Loading submit | `Button loading={isPending}` + `useTransition` |
| Auth | `requireRoles(['SUPER_ADMIN', 'MANAGER'])` на server pages |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| Ant Design 6 | Table, Form, Modal, Button, Input, Tag, Breadcrumb, Empty, message | project standard |

---

## Component Reuse Map

| New | Reuse from |
|-----|------------|
| `SubjectsList` | `GroupsList` structure |
| `CreateSubjectForm` / `EditSubjectForm` | `CreateGroupForm` |
| `LevelsTable` (subject-scoped links) | existing `LevelsTable` — add `subjectId` prop |
| Program pages | move under `admin/subjects/[subjectId]/program/` |
| Step editor | `StepEditor`, `BlockRenderer` — без UI-изменений |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-07-07

**Notes (FLAG, non-blocking):**
- Breadcrumbs рекомендованы, но не BLOCK — executor может добавить в первом плане UI-задачи
- Ссылка на предмет в таблице: использовать antd link styling, не хардкод `#c9a84c` как в `GroupsList` (техдолг groups — не копировать в subject-admin)
