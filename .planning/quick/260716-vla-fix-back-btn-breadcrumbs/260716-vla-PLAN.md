---
phase: 260716-vla-fix-back-btn-breadcrumbs
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/program-admin/actions/program-actions.ts
  - src/features/program-admin/actions/program-actions.test.ts
  - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
  - src/features/program-admin/ui/StepForm.tsx
autonomous: true
requirements:
  - QUICK-back-btn-breadcrumbs
user_setup: []
must_haves:
  truths:
    - "Страница редактирования шага показывает пользователю явный путь навигации: Предметы -> предмет -> уровень -> редактирование шага"
    - "Возврат со страницы редактирования выполняется одним кликом по явной ссылке на страницу уровня, без зависимости от history stack браузера"
    - "Редактирование шага остаётся привязанным к route scope: subjectId, levelId и stepId должны соответствовать друг другу"
  artifacts:
    - path: src/features/program-admin/actions/program-actions.ts
      provides: "scoped getStep с данными для breadcrumbs и проверкой принадлежности шага уровню/предмету"
    - path: src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
      provides: "breadcrumbs и явная кнопка возврата к шагам уровня"
    - path: src/features/program-admin/ui/StepForm.tsx
      provides: "детерминированная навигация после save/cancel на тот же explicit level route"
  key_links:
    - from: edit page route params
      to: program-actions getStep
      via: "subjectId + levelId + stepId scoped query"
    - from: edit page breadcrumbs/back CTA
      to: level steps page
      via: "programLevelPath(subjectId, levelId)"
    - from: StepForm save/cancel
      to: level steps page
      via: "explicit cancelHref instead of router.back/history assumptions"
---

<objective>
Исправить навигацию на странице редактирования шага предмета: пользователь должен видеть breadcrumbs и уходить со страницы за один клик по явной ссылке на уровень, а не через ненадёжный history-back сценарий.

Purpose: Сейчас edit-page рендерит только заголовок и форму, без собственного навигационного каркаса. В результате пользователь ориентируется по браузерной кнопке назад или incidental history stack после внутренних переходов, что и даёт эффект "нужно нажимать несколько раз".

Output: scoped server fetch для шага, breadcrumbs + back CTA на edit-page, сохранённая deterministic navigation в форме, regression-тест на route scoping.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/features/program-admin/actions/program-actions.ts
@src/features/program-admin/actions/program-actions.test.ts
@src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
@src/features/program-admin/ui/StepForm.tsx
@src/features/program-admin/ui/LevelStepsView.tsx
@src/features/program-admin/lib/program-paths.ts
</context>

## Root Cause

1. `src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx` не рендерит breadcrumbs и не даёт явного возврата в контекст уровня; пользователь вынужден пользоваться браузерным back.
2. В релевантных program-admin файлах нет `router.back()`, а `StepForm` уже использует explicit `programLevelPath(subjectId, levelId)` для save/cancel. Значит фикс должен усиливать этот deterministic path на самой edit-page, а не чинить history API.
3. `getStep(stepId)` не проверяет соответствие `subjectId/levelId` из URL. Для breadcrumbs и back target нужен scoped fetch с названием предмета/уровня и защитой от route mismatch.

## Source Coverage Audit

| Source | Item | Status |
|--------|------|--------|
| GOAL | Исправить back-navigation на странице редактирования шага | COVERED — Task 2 |
| GOAL | Добавить breadcrumbs над заголовком edit-page | COVERED — Task 2 |
| REQ | QUICK-back-btn-breadcrumbs | COVERED — весь план |
| RESEARCH | Исследование не требуется (quick mode, existing patterns only) | N/A |
| CONTEXT | Discuss/locked decisions отсутствуют | N/A |
| Deferred | — | none |
| Out of scope | Новый layout admin-раздела, глобальный Breadcrumb wrapper, изменение маршрутов program admin, browser-history hacks | excluded |

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Зафиксировать scoped fetch шага и данные для навигации</name>
  <files>src/features/program-admin/actions/program-actions.ts, src/features/program-admin/actions/program-actions.test.ts</files>
  <behavior>
    - getStep для edit-page возвращает шаг только если `stepId` принадлежит `levelId`, а `levelId` принадлежит `subjectId`
    - scoped getStep отдаёт данные, достаточные для breadcrumbs: название предмета, номер/название уровня, название шага
    - при route mismatch edit-page получает `null` и уходит в `notFound()`, а не показывает шаг из чужого уровня
  </behavior>
  <action>
    1. В `program-actions.ts` заменить текущий `getStep(stepId)` на scoped вариант для edit-page: принимать `subjectId`, `levelId`, `stepId` и читать шаг через Prisma с фильтром по `id` + `levelId` + `level.subjectId`.
    2. В тот же запрос включить только нужные relation-поля для UI-обвязки: `level.id`, `level.number`, `level.title`, `level.subject.id`, `level.subject.name`; не расширять контракт сверх необходимого.
    3. Не менять create/update/delete flow и revalidate paths: задача только в safe read-contract для edit-page.
    4. В `program-actions.test.ts` добавить regression-тесты для scoped query:
       - успешный кейс возвращает шаг с subject/level метаданными;
       - mismatch subject/level -> `null`.
    5. Проверку реализовать через существующий мок Prisma-паттерн этого файла, не заводя новый test harness.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/features/program-admin/actions/program-actions.test.ts</automated>
  </verify>
  <done>Scoped getStep защищает route scope и отдаёт breadcrumb-данные; unit-test покрывает happy path и mismatch path.</done>
</task>

<task type="auto">
  <name>Task 2: Добавить breadcrumbs и явный возврат к шагам уровня</name>
  <files>src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx, src/features/program-admin/ui/StepForm.tsx</files>
  <action>
    1. В edit-page использовать scoped getStep из Task 1; при `null` делать `notFound()`.
    2. Над заголовком добавить `Breadcrumb` по образцу `LevelStepsView.tsx`:
       - `Предметы` -> `/admin/subjects`
       - `{subjectName}` -> `programListPath(subjectId)`
       - `{levelTitle}` -> `programLevelPath(subjectId, levelId)`
       - текущий элемент: `Редактирование: {step.title}` без ссылки.
    3. Рядом с заголовком или сразу под breadcrumbs добавить явный back CTA на `programLevelPath(subjectId, levelId)` (`Link`/`Button` или текстовая ссылка в текущем UI-стиле). Не использовать `router.back()`, `window.history.back()` или логику по длине history stack.
    4. В `StepForm.tsx` сохранить и при необходимости визуально усилить deterministic return path:
       - `cancelHref` остаётся `programLevelPath(subjectId, levelId)`;
       - submit по-прежнему завершает `router.push(cancelHref)` + `router.refresh()`;
       - если текст кнопки "Отмена" неочевиден рядом с новым back CTA, переименовать вторичную кнопку в более явный вариант вроде `К шагам уровня`, но без дублирования двух одинаковых первичных affordance.
    5. Не менять структуру полей формы, rich text editor, payload save/update и program routes. Фикс только навигационный и shell-level.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/features/program-admin/actions/program-actions.test.ts && pnpm exec tsc --noEmit</automated>
  </verify>
  <done>На edit-page есть breadcrumbs и явный возврат на страницу уровня; уход со страницы не зависит от browser history и выполняется одним кликом по explicit route.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL params -> server data fetch | Непроверенные `subjectId/levelId/stepId` из маршрута используются для чтения шага |
| Edit page CTA -> admin program routes | UI-навигация переводит менеджера/админа между subject/level страницами |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-vla-01 | Information Disclosure | getStep edit-page read | medium | mitigate | Scoped Prisma query по `stepId + levelId + subjectId` не позволяет открыть шаг из чужого уровня по прямому URL |
| T-vla-02 | Tampering | back-navigation behavior | low | mitigate | Явный route target через `programLevelPath` убирает зависимость от history stack и случайных промежуточных переходов |
| T-vla-03 | Spoofing | breadcrumbs labels | low | mitigate | Breadcrumb labels брать только из scoped server data, а не из params/query string |
| T-vla-SC | Tampering | npm installs | low | accept | Новых пакетов нет |
</threat_model>

<verification>
- `pnpm exec vitest run src/features/program-admin/actions/program-actions.test.ts`
- `pnpm exec tsc --noEmit`
- Manual smoke:
  1. Открыть `/admin/subjects/{subjectId}/program/{levelId}/steps/{stepId}/edit`
  2. Убедиться, что над заголовком есть breadcrumbs `Предметы / {предмет} / {уровень} / Редактирование...`
  3. Клик по back CTA или breadcrumb уровня сразу возвращает на `/admin/subjects/{subjectId}/program/{levelId}`
  4. `Отмена` и `Сохранить` после редактирования приводят на ту же страницу уровня без дополнительных back-кликов
</verification>

<success_criteria>
- Пользователь видит контекст маршрута на edit-page без необходимости ориентироваться по browser history
- Возврат со страницы редактирования шага выполняется одним кликом по explicit route
- Route mismatch `subjectId/levelId/stepId` не показывает чужой шаг и приводит к `notFound()`
</success_criteria>

<output>
Create `.planning/quick/260716-vla-fix-back-btn-breadcrumbs/260716-vla-SUMMARY.md` when done
</output>
---
phase: quick-260716-vla-fix-back-btn-breadcrumbs
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/admin.spec.ts
  - src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
  - src/features/program-admin/ui/StepForm.tsx
autonomous: true
requirements:
  - quick-260716-vla
must_haves:
  truths:
    - "Менеджер или супер-админ покидает страницу редактирования шага за одно явное действие, без повторных нажатий и зависимости от history stack."
    - "На странице редактирования шага видны хлебные крошки до списка шагов уровня."
    - "После сохранения или отмены пользователь возвращается на страницу шагов текущего уровня по явному маршруту."
  artifacts:
    - path: "e2e/admin.spec.ts"
      provides: "Регрессия на возврат и breadcrumbs для редактирования шага предмета"
    - path: "src/features/program-admin/ui/StepForm.tsx"
      provides: "Детерминированная навигация после save/cancel через route path, а не browser history"
    - path: "src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx"
      provides: "UI редактирования шага с breadcrumbs и явным back target"
  key_links:
    - from: "src/features/program-admin/ui/StepForm.tsx"
      to: "src/features/program-admin/lib/program-paths.ts"
      via: "programLevelPath формирует единственный back target для save/cancel"
      pattern: "programLevelPath\\(subjectId, levelId\\)"
    - from: "src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx"
      to: "src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/page.tsx"
      via: "breadcrumbs и back link ведут на страницу шагов уровня"
      pattern: "/admin/subjects/.+/program/.+"
---

<objective>
Исправить нестабильный возврат со страницы редактирования шага предмета и добавить breadcrumbs на этот экран.

Purpose: убрать зависимость от history stack и сделать навигацию предсказуемой для менеджера/супер-админа.
Output: покрытая тестом страница редактирования шага с явным маршрутом назад и хлебными крошками.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@e2e/admin.spec.ts
@src/features/program-admin/lib/program-paths.ts
@src/features/program-admin/ui/LevelStepsView.tsx
@src/features/program-admin/ui/StepForm.tsx
@src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/page.tsx
@src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Зафиксировать регрессию редактирования шага в e2e</name>
  <files>e2e/admin.spec.ts</files>
  <behavior>
    - Менеджер открывает страницу редактирования шага предмета и сразу видит breadcrumbs с сегментами "Предметы" -> "{предмет}" -> "{уровень}".
    - Клик по явному действию возврата со страницы редактирования переводит на `/admin/subjects/{subjectId}/program/{levelId}` за один клик.
    - После сохранения изменений пользователь также оказывается на странице шагов текущего уровня, а изменённый заголовок шага виден в таблице.
  </behavior>
  <action>Добавь в `e2e/admin.spec.ts` отдельный сценарий для subject program editor: открой существующий уровень и конкретный шаг, проверь наличие breadcrumbs и явного возврата, затем отдельно проверь save-flow. Не используй `page.goBack()` как критерий корректности; проверяй именно URL уровня и видимость таблицы шагов, чтобы баг с многократным "назад" был пойман автоматически.</action>
  <verify>
    <automated>pnpm exec playwright test e2e/admin.spec.ts --grep "редактирование шага предмета"</automated>
  </verify>
  <done>Есть падающая до фикса и проходящая после фикса e2e-регрессия, которая доказывает одношаговый возврат и наличие breadcrumbs.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Убрать history-зависимость из формы шага</name>
  <files>src/features/program-admin/ui/StepForm.tsx</files>
  <behavior>
    - Отмена всегда ведёт на страницу шагов текущего уровня по одному и тому же href.
    - После успешного `updateStep` или `createStep` форма возвращает на тот же route path без промежуточного history-поведения.
    - Навигация не требует повторного клика даже если пользователь попал на edit-страницу через redirect, refresh или внутренние переходы редактора.
  </behavior>
  <action>Оставь единственным источником back target `programLevelPath(subjectId, levelId)`. Сохрани deterministic redirect после submit и не вводи `router.back()` или другие history-зависимые обходы. Если текущая комбинация `router.push(cancelHref)` и немедленного `router.refresh()` создаёт лишнее навигационное состояние, упрости flow до явного перехода на parent route per quick-260716-vla и держи cancel/save на одном контракте возврата.</action>
  <verify>
    <automated>pnpm exec eslint "src/features/program-admin/ui/StepForm.tsx" && pnpm exec playwright test e2e/admin.spec.ts --grep "редактирование шага предмета"</automated>
  </verify>
  <done>Форма шага использует явный route path уровня как единый путь возврата, а e2e подтверждает отсутствие многошагового выхода со страницы.</done>
</task>

<task type="auto">
  <name>Task 3: Добавить breadcrumbs и явную кнопку возврата на edit page</name>
  <files>src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx</files>
  <action>Расширь серверную страницу редактирования шага так, чтобы она загружала данные, достаточные для breadcrumbs: ссылку на список предметов, ссылку на программу предмета, ссылку на страницу шагов текущего уровня и текущий шаг как последний сегмент. Возьми визуальный паттерн `Breadcrumb` из `LevelStepsView.tsx`, но адаптируй текст под edit page. Добавь явную кнопку "Назад" или link рядом с заголовком, ведущую на `programLevelPath(subjectId, levelId)` per quick-260716-vla; не полагайся на браузерную кнопку назад и не скрывай единственный путь возврата внутри формы.</action>
  <verify>
    <automated>pnpm exec eslint "src/app/(dashboard)/admin/subjects/[subjectId]/program/[levelId]/steps/[stepId]/edit/page.tsx" && pnpm exec playwright test e2e/admin.spec.ts --grep "редактирование шага предмета"</automated>
  </verify>
  <done>На странице редактирования шага над заголовком есть breadcrumbs, рядом доступен явный возврат к списку шагов уровня, и навигация согласована с поведением формы.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| manager/super-admin -> edit page route | Ненадёжные route params `subjectId`, `levelId`, `stepId` попадают в серверную страницу |
| client form -> server actions | Пользовательский ввод шага уходит в `createStep` / `updateStep` |
| client navigation -> parent level route | Ошибка в target route может увести пользователя на неверный уровень или скрыть успешное сохранение |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-quick-260716-vla-01 | Tampering | `edit/page.tsx` route params | medium | mitigate | Сохранить существующие role checks и строить breadcrumbs/back link только из уже авторизованных `subjectId`/`levelId` параметров текущего маршрута |
| T-quick-260716-vla-02 | Elevation | `StepForm.tsx` navigation flow | medium | mitigate | Не вводить новые свободные redirect params; использовать только `programLevelPath(subjectId, levelId)` из trusted route context |
| T-quick-260716-vla-03 | Repudiation | save/cancel UX | low | accept | Quick task не меняет аудит действий; достаточно детерминированного URL и e2e-регрессии на навигацию |
| T-quick-260716-vla-SC | Tampering | pnpm installs | low | accept | В этом quick task новые пакеты не добавляются; install-риска нет |
</threat_model>

<verification>
Прогнать точечную e2e-регрессию для редактирования шага и локальный eslint только по затронутым файлам. Дополнительно убедиться, что после сохранения изменённый шаг отображается на странице уровня без ручного возврата через browser back.
</verification>

<success_criteria>
Менеджер или супер-админ открывает edit page шага, видит breadcrumbs, нажимает явный возврат и сразу попадает на страницу шагов уровня. После сохранения изменений возврат происходит на ту же страницу уровня автоматически и за один переход.
</success_criteria>

<output>
Create `.planning/quick/260716-vla-fix-back-btn-breadcrumbs/260716-vla-SUMMARY.md` when done
</output>
