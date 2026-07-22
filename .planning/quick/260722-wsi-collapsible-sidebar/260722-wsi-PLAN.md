---
phase: 260722-wsi-collapsible-sidebar
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/widgets/app-shell/lib/sidebar-storage.ts
  - src/widgets/app-shell/ui/AppShell.tsx
autonomous: true
requirements:
  - QUICK-collapsible-sidebar
user_setup: []

must_haves:
  truths:
    - "На десктопе пользователь может свернуть и развернуть левый сайдбар кнопкой в UI"
    - "Состояние collapsed/expanded сохраняется в localStorage и восстанавливается после перезагрузки"
    - "На мобилке поведение Drawer (бургер) не ломается; persistence относится только к десктопному Sider"
    - "В свёрнутом режиме по-прежнему скрыты текст логотипа, подписи пунктов (через Menu inline collapsed) и «Выйти»"
  artifacts:
    - path: src/widgets/app-shell/lib/sidebar-storage.ts
      provides: "ключ + read/write boolean collapsed для localStorage"
    - path: src/widgets/app-shell/ui/AppShell.tsx
      provides: "видимый toggle, onCollapse с persist, hydrate из storage"
  key_links:
    - from: toggle / Sider.onCollapse
      to: setCollapsed + writeSidebarCollapsed
      via: "единый handler обновляет state и localStorage"
    - from: mount (client)
      to: collapsed state
      via: "useEffect читает storage после hydration (без SSR mismatch)"
    - from: Layout.Sider.collapsed
      to: NavPanel collapsed prop
      via: "уже существующая проводка; не трогать mobile Drawer expanded"
---

<objective>
Сделать десктопный левый сайдбар сворачиваемым с видимым переключателем и запоминать collapsed/expanded между сессиями через localStorage.

Purpose: У пользователя уже есть `useState(collapsed)` и `Sider collapsible`, но `trigger={null}` скрывает UI, а preference не персистится — закрыть оба пробела без расширения scope.

Output: helper `sidebar-storage.ts` + обновлённый `AppShell.tsx` (toggle + hydrate/persist).
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/widgets/app-shell/ui/AppShell.tsx
@src/features/journal/lib/journal-storage.ts
@src/widgets/app-shell/index.ts
</context>

## Current State

В `AppShell.tsx` уже есть:
- `const [collapsed, setCollapsed] = useState(false)`
- `Sider` с `collapsible`, `collapsed={collapsed}`, `onCollapse={setCollapsed}`, **`trigger={null}`** (триггер скрыт — свернуть нельзя из UI)
- `NavPanel` корректно реагирует на `collapsed` (логотип, UserSwitcher, кнопка «Выйти»)
- Mobile: `Drawer` + бургер в Header; `NavPanel` на мобилке всегда `collapsed={false}`

Persistence для сайдбара отсутствует. Паттерн localStorage в проекте: `journal-storage.ts` / `analytics-storage.ts` — константа ключа, `typeof window` guard, try/catch.

**Out of scope:** баг навигации «Моя зарплата» (уже отдельный quick), redesign меню, cookie/серверная persistence, изменение mobile Drawer.

## Source Coverage Audit

| Source | Item | Status |
|--------|------|--------|
| GOAL | Сворачиваемое левое меню с UI-переключателем | COVERED — Task 2 |
| GOAL | Запоминать collapsed/expanded между сессиями | COVERED — Task 1–2 |
| REQ | QUICK-collapsible-sidebar | COVERED — весь план |
| RESEARCH | Quick mode, research skipped; localStorage + Ant Design Sider | COVERED — Task 1–2 |
| CONTEXT | Quick constraints: FSD widgets, localStorage, leverage Sider, no salary-nav scope | COVERED |
| Deferred | Teacher salary nav, unrelated bugs | excluded |

<tasks>

<task type="auto">
  <name>Task 1: Sidebar collapsed localStorage helper</name>
  <files>src/widgets/app-shell/lib/sidebar-storage.ts</files>
  <read_first>
    - src/features/journal/lib/journal-storage.ts — эталон read/write + window/try-catch
    - src/widgets/app-shell/ui/AppShell.tsx — где будет вызываться helper
  </read_first>
  <action>
    Создать `src/widgets/app-shell/lib/sidebar-storage.ts` по паттерну journal-storage:
    1. Экспорт константы ключа вида `app-shell:sidebar-collapsed` (имя константы SCREAMING_SNAKE, например `SIDEBAR_COLLAPSED_STORAGE_KEY`).
    2. `readSidebarCollapsed(): boolean | null` — при SSR (`window` отсутствует) или ошибке/невалидном значении вернуть `null`; валидные значения: строки `"1"` / `"0"` (или `"true"`/`"false"` — выбрать один формат и придерживаться его).
    3. `writeSidebarCollapsed(collapsed: boolean): void` — no-op на SSR; try/catch вокруг `setItem`, ошибки игнорировать.
    Не импортировать React. Не трогать AppShell в этой задаче.
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -n 40</automated>
  </verify>
  <done>
    Helper экспортирует ключ, read (boolean|null) и write; безопасен на SSR и при недоступном localStorage.
  </done>
</task>

<task type="auto">
  <name>Task 2: Visible toggle + persist/hydrate in AppShell</name>
  <files>src/widgets/app-shell/ui/AppShell.tsx</files>
  <read_first>
    - src/widgets/app-shell/ui/AppShell.tsx — collapsed state (~334), Sider (~392–402), Header mobile burger (~425–432), NavPanel collapsed wiring
    - src/widgets/app-shell/lib/sidebar-storage.ts — API из Task 1
  </read_first>
  <action>
    В `AppShell.tsx`:
    1. Импортировать `readSidebarCollapsed` / `writeSidebarCollapsed` из `../lib/sidebar-storage`. Импортировать иконки `MenuFoldOutlined` и `MenuUnfoldOutlined` из `@ant-design/icons`.
    2. Hydrate: после mount (`useEffect` один раз) вызвать `readSidebarCollapsed()`; если не `null` — `setCollapsed(value)`. Не читать localStorage в initializer `useState`, чтобы избежать hydration mismatch с SSR.
    3. Единый handler (например `handleCollapse(next: boolean)`): `setCollapsed(next)` + `writeSidebarCollapsed(next)`. Передать его в `Sider.onCollapse` вместо голого `setCollapsed`.
    4. Видимый toggle на десктопе: в `Header` (рядом с местом mobile-бургера, но при `!isMobile`) кнопка `type="text"` с иконкой fold/unfold в зависимости от `collapsed`, `aria-label` на русском («Свернуть меню» / «Развернуть меню»), `onClick` переключает через handler. Mobile-бургер не менять.
    5. Оставить `trigger={null}` на Sider (кастомная кнопка в Header вместо дефолтного antd-триггера внизу). Не менять ширину Sider, Drawer, состав меню, роли, UserSwitcher. Persistence только для десктопного `collapsed`; open-состояние Drawer не писать в storage.
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -n 40</automated>
  </verify>
  <done>
    На десктопе кнопка сворачивает/разворачивает сайдбар; после reload состояние восстанавливается из localStorage; мобильный Drawer без регрессий.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser localStorage → client UI state | Недоверенное UI-preference; влияет только на layout, не на auth |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260722-wsi-01 | Tampering | sidebar-storage localStorage | low | accept | Значение только boolean UI; порча → fallback expanded; нет влияния на роли/данные |
| T-260722-wsi-02 | Information Disclosure | localStorage key | low | accept | Флаг collapsed не PII и не секрет |
| T-260722-wsi-03 | Denial of Service | QuotaExceeded on setItem | low | mitigate | try/catch в write; UI продолжает работать без persist |
</threat_model>

<verification>
- `pnpm exec tsc --noEmit -p tsconfig.json` без ошибок в изменённых файлах
- Smoke (после execute): десктоп — свернуть → reload → остаётся свёрнутым; развернуть → reload → развёрнут; мобилка — бургер/Drawer как раньше
</verification>

<success_criteria>
- Десктопный сайдбар сворачивается видимой кнопкой в Header
- Preference collapsed/expanded переживает перезагрузку страницы (localStorage)
- Mobile Drawer не затронут persistence-логикой
- Scope не расширен на чужие баги навигации
</success_criteria>

<output>
Create `.planning/quick/260722-wsi-collapsible-sidebar/260722-wsi-SUMMARY.md` when done
</output>
