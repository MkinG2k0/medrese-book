---
phase: 260716-mzj-accountant-role-select
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/auth/lib/resolve-switch-access.ts
  - src/features/auth/lib/can-switch-user.ts
  - src/features/auth/lib/can-switch-user.test.ts
  - src/features/auth/actions/switch-user-actions.ts
autonomous: true
requirements:
  - QUICK-accountant-role-select
user_setup: []

must_haves:
  truths:
    - "Бухгалтер (ACCOUNTANT) видит UserSwitcher в сайдбаре, когда getSwitchableUsers возвращает непустой список"
    - "Нативный вход как ACCOUNTANT даёт тот же privileged-список, что у MANAGER (все роли кроме STUDENT)"
    - "После переключения MANAGER→ACCOUNTANT селект остаётся и позволяет вернуться к менеджеру (switchOwnerId privileged owner сохраняется)"
    - "AppShell не меняется: условие switchableUsers.length > 0 уже корректно"
  artifacts:
    - path: src/features/auth/lib/resolve-switch-access.ts
      provides: "resolveSwitchAccess разрешает ACCOUNTANT"
    - path: src/features/auth/actions/switch-user-actions.ts
      provides: "getSwitchableUsers возвращает privileged list для ACCOUNTANT"
    - path: src/features/auth/lib/can-switch-user.ts
      provides: "canSwitchUser(true) для ACCOUNTANT"
  key_links:
    - from: dashboard layout getSwitchableUsers
      to: AppShell UserSwitcher
      via: "switchableUsers.length > 0"
    - from: resolveSwitchAccess
      to: getSwitchableUsers / switchUser
      via: "access.allowed + switchOwnerId"
---

<objective>
Показать UserSwitcher бухгалтеру: роль ACCOUNTANT должна участвовать в privileged switch access так же, как MANAGER/SUPER_ADMIN.

Purpose: После добавления роли ACCOUNTANT её забыли в `resolveSwitchAccess` / `getSwitchableUsers`. AppShell уже рендерит селект при непустом списке — UI-фильтра по роли нет. Без access-fix селект не появится.

Output: ACCOUNTANT получает allowed switch + privileged user list; unit-тест на canSwitchUser; AppShell не трогаем.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260624-psw-restrict-user-switcher/260624-psw-SUMMARY.md
@.planning/quick/260701-ppw-fix-manager-teacher-switch/260701-ppw-SUMMARY.md
@src/features/auth/lib/resolve-switch-access.ts
@src/features/auth/lib/can-switch-user.ts
@src/features/auth/actions/switch-user-actions.ts
@src/app/(dashboard)/layout.tsx
@src/widgets/app-shell/ui/AppShell.tsx
</context>

## Root Cause

1. `resolveSwitchAccess` разрешает только `SUPER_ADMIN` | `MANAGER` | `TEACHER` (замещение / privileged owner). Для `ACCOUNTANT` — fallthrough `{ allowed: false }` → `getSwitchableUsers()` сразу `[]`.
2. Даже при `allowed: true` в `getSwitchableUsers` нет ветки для `ACCOUNTANT` (только admin/manager и teacher) → снова `[]`.
3. `AppShell` / `UserSwitcher` **не** скрывают бухгалтера: условие только `switchableUsers.length > 0`. Seed бухгалтера (`400001`) есть — проблема не в данных.

Паттерн фикса — как для MANAGER + ветка privileged `switchOwnerId` из quick `260701-ppw` (чтобы MANAGER→ACCOUNTANT→назад не ломался).

## Source Coverage Audit

| Source | Item | Status |
|--------|------|--------|
| GOAL | UserSwitcher у ACCOUNTANT в сайдбаре | COVERED — Task 1–2 |
| REQ | QUICK-accountant-role-select | COVERED — весь план |
| RESEARCH | (нет research phase) | N/A |
| CONTEXT | (нет discuss / D-XX) | N/A |
| Deferred | — | none |
| Out of scope | NotificationBell для ACCOUNTANT; смена меню; STUDENT в switcher; UI redesign AppShell | excluded |

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Разрешить ACCOUNTANT в resolveSwitchAccess и canSwitchUser</name>
  <files>src/features/auth/lib/resolve-switch-access.ts, src/features/auth/lib/can-switch-user.ts, src/features/auth/lib/can-switch-user.test.ts</files>
  <behavior>
    - canSwitchUser('ACCOUNTANT') → true (как SUPER_ADMIN/MANAGER)
    - canSwitchUser('TEACHER') без switchOwnerId → false; с truthy switchOwnerId → true (текущее поведение сохранить)
    - canSwitchUser('STUDENT') → false
    - resolveSwitchAccess для ACCOUNTANT без switchOwnerId → { allowed: true, switchOwnerId: session.user.id }
    - resolveSwitchAccess для ACCOUNTANT с switchOwnerId privileged (MANAGER/SUPER_ADMIN) → { allowed: true, switchOwnerId: тот же owner } — зеркало TEACHER+privileged owner из 260701-ppw
  </behavior>
  <action>
    1. В `can-switch-user.ts` добавить ACCOUNTANT в privileged-проверку рядом с SUPER_ADMIN и MANAGER (не менять семантику TEACHER через switchOwnerId).
    2. Добавить `can-switch-user.test.ts` (vitest): кейсы из behavior выше.
    3. В `resolve-switch-access.ts` до ветки TEACHER (или сразу после MANAGER/SUPER_ADMIN): обработать ACCOUNTANT.
       - Если `session.user.switchOwnerId` задан и `isPrivilegedSwitchOwner(switchOwnerId)` — вернуть `{ allowed: true, switchOwnerId: session.user.switchOwnerId }` (возврат к менеджеру/админу после impersonation).
       - Иначе — `{ allowed: true, switchOwnerId: session.user.id }` (нативный бухгалтер = privileged actor).
    4. Не менять TEACHER/STUDENT ветки и `isPrivilegedSwitchOwner` (бухгалтер не становится privileged owner для чужих сессий — только actor).
  </action>
  <verify>
    <automated>pnpm exec vitest run src/features/auth/lib/can-switch-user.test.ts</automated>
  </verify>
  <done>canSwitchUser включает ACCOUNTANT; resolveSwitchAccess возвращает allowed для нативного ACCOUNTANT и для ACCOUNTANT под privileged switchOwnerId.</done>
</task>

<task type="auto">
  <name>Task 2: Вернуть privileged list в getSwitchableUsers для ACCOUNTANT</name>
  <files>src/features/auth/actions/switch-user-actions.ts</files>
  <action>
    1. В `getSwitchableUsers` расширить условие privileged-списка: наряду с SUPER_ADMIN и MANAGER вызывать `getPrivilegedSwitchableUsers()` и для ACCOUNTANT (тот же `where: { role: { not: 'STUDENT' } }`).
    2. Не дублировать отдельный Prisma-запрос — переиспользовать `getPrivilegedSwitchableUsers()`.
    3. Ветку TEACHER (замещение / privileged owner → full list) не трогать.
    4. `switchUser` менять не нужно: он уже опирается на `resolveSwitchAccess` + `getSwitchableUsers` и блокирует STUDENT.
    5. AppShell / layout / UserSwitcher не менять — после Task 1–2 `switchableUsers` перестанет быть пустым, селект появится сам.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/features/auth/lib/can-switch-user.test.ts; rg -n "ACCOUNTANT" src/features/auth/actions/switch-user-actions.ts src/features/auth/lib/resolve-switch-access.ts src/features/auth/lib/can-switch-user.ts</automated>
  </verify>
  <done>getSwitchableUsers для ACCOUNTANT возвращает тот же non-STUDENT список, что у менеджера; rg показывает ACCOUNTANT во всех трёх файлах access/list/canSwitch.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| JWT session → switchUser server action | Аутентифицированный пользователь запрашивает вход под другим code |
| resolveSwitchAccess → getSwitchableUsers | Решение, кого можно видеть/выбрать в сайдбаре |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mzj-01 | Elevation of Privilege | resolveSwitchAccess + switchUser | high | mitigate | ACCOUNTANT получает тот же privileged switch, что MANAGER (продуктовое требование). Список без STUDENT; switchUser по-прежнему отклоняет STUDENT и чужих вне getSwitchableUsers |
| T-mzj-02 | Spoofing | switchOwnerId на ACCOUNTANT-сессии | medium | mitigate | При impersonation от MANAGER/SUPER_ADMIN сохранять switchOwnerId владельца (как TEACHER в 260701-ppw), не подменять на id бухгалтера |
| T-mzj-03 | Information Disclosure | getPrivilegedSwitchableUsers | low | accept | Имена/роли staff уже доступны менеджеру; бухгалтер видит тот же staff-список по решению UX |
| T-mzj-SC | Tampering | npm installs | low | accept | Новых пакетов нет |
</threat_model>

<verification>
- Unit: `pnpm exec vitest run src/features/auth/lib/can-switch-user.test.ts`
- Static: ACCOUNTANT присутствует в resolve-switch-access, switch-user-actions, can-switch-user
- Manual smoke (executor после кода): войти кодом бухгалтера из seed (`400001`) → в сайдбаре есть UserSwitcher → можно выбрать менеджера/учителя и вернуться
</verification>

<success_criteria>
- Нативный ACCOUNTANT: `getSwitchableUsers().length > 0` и UserSwitcher виден
- MANAGER→ACCOUNTANT: селект остаётся, возврат к менеджеру работает через сохранённый privileged switchOwnerId
- STUDENT по-прежнему не в списке и не через switchUser
</success_criteria>

<output>
Create `.planning/quick/260716-mzj-accountant-role-select/260716-mzj-SUMMARY.md` when done
</output>
