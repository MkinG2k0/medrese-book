---
phase: 260722-wka-teacher-salary-nav-bug
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/lib/match-role-route.ts
  - src/shared/lib/match-role-route.test.ts
  - src/shared/lib/auth.config.ts
  - src/widgets/app-shell/ui/AppShell.tsx
autonomous: true
requirements:
  - QUICK-teacher-salary-nav-bug
user_setup: []

must_haves:
  truths:
    - "Учитель с ролью TEACHER открывает /accounting/my-salary без редиректа на /journal"
    - "Бухгалтер ACCOUNTANT по-прежнему допускается на /accounting и отклоняется на /accounting/my-salary"
    - "После успешного совпадения самого длинного roleRoutes-префикса проверка останавливается (нет повторного deny по короткому родителю)"
    - "На странице «Моя зарплата» в сайдбаре подсвечен пункт «Моя зарплата», а не «Журнал»"
  artifacts:
    - path: src/shared/lib/match-role-route.ts
      provides: "чистая функция longest-prefix match + allow/deny/login для roleRoutes"
    - path: src/shared/lib/match-role-route.test.ts
      provides: "regression: TEACHER my-salary vs ACCOUNTANT-only /accounting и другие parent/child пары"
    - path: src/shared/lib/auth.config.ts
      provides: "authorized использует matcher и не продолжает цикл после allow"
    - path: src/widgets/app-shell/ui/AppShell.tsx
      provides: "selectedKey без фолбэка на menuItems[0] при отсутствии матча"
  key_links:
    - from: pathname /accounting/my-salary
      to: TEACHER allow
      via: "matchRoleRouteAccess longest prefix /accounting/my-salary"
    - from: authorized callback
      to: getDefaultRedirect only on deny
      via: "early stop after allow; deny still redirects"
    - from: usePathname
      to: Menu selectedKeys
      via: "longest menu key match or undefined (no false Journal highlight)"
---

<objective>
Исправить баг middleware: учитель при клике «Моя зарплата» получает редирект на `/journal` из-за продолжения цикла `roleRoutes` после успешного match длинного префикса; закрыть regression-тестом и убрать ложную подсветку «Журнал» в сайдбаре.

Purpose: Восстановить доступ TEACHER к `/accounting/my-salary` в production и локально; устранить симптоматику selectedKey на чужих URL.

Output: `match-role-route` helper + тесты, фикс `auth.config.ts`, hardening `AppShell` selectedKey.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/shared/lib/auth.config.ts
@src/shared/lib/get-default-redirect.ts
@src/widgets/app-shell/ui/AppShell.tsx
@src/app/(dashboard)/accounting/my-salary/page.tsx
@src/app/(dashboard)/student/me/page.tsx
@src/shared/lib/session.ts
@src/shared/lib/messaging/can-message-user.test.ts
</context>

## Root Cause

В `auth.config.ts` `authorized` сортирует `roleRoutes` по длине префикса (longest-first), но после **успешной** проверки роли для длинного префикса цикл **не останавливается**.

Для pathname `/accounting/my-salary` и роли `TEACHER`:

1. Match `/accounting/my-salary` → TEACHER allowed → цикл продолжается (баг)
2. Match `/accounting` через `pathname.startsWith('/accounting/')` → roles = `['ACCOUNTANT']` → TEACHER denied → `redirectTo(getDefaultRedirect('TEACHER'))` = `/journal`

Симптом AppShell: если pathname не матчится с пунктами меню текущей роли, `selectedKey` падает на `menuItems[0]` (`/journal` для TEACHER) — отсюда подсветка «Журнал» на чужой странице (например `/student/me` при роли Учитель в шапке).

Страница ученика при роли учителя — вероятный побочный эффект soft-navigation/RSC после ошибочного редиректа или рассинхрона URL; закрывается фиксом auth + hardening selectedKey. Отдельное расследование Dokploy/redeploy не входит в задачи.

**Note (не задача):** после фикса нужен redeploy production; в логах упоминалась Next 14.1.4 vs repo 16.1.6 — убедиться, что на прод уходит актуальный билд.

## Source Coverage Audit

| Source | Item | Status |
|--------|------|--------|
| GOAL | TEACHER открывает «Моя зарплата» без редиректа на журнал | COVERED — Task 1–2 |
| GOAL | Regression-тест nested roleRoutes prefixes | COVERED — Task 2 |
| GOAL | AppShell не подсвечивает Журнал на несвязанном pathname | COVERED — Task 3 |
| REQ | QUICK-teacher-salary-nav-bug | COVERED — весь план |
| RESEARCH | Quick mode, research phase skipped; suspected root cause given | N/A |
| CONTEXT | Fix authorized loop: stop/return true after successful match | COVERED — Task 1 |
| CONTEXT | Unit test teacher my-salary vs accountant /accounting | COVERED — Task 2 |
| CONTEXT | Optionally harden AppShell selectedKey | COVERED — Task 3 |
| Deferred / out of scope | Dokploy/deploy investigation, Next version alignment as required work, rewrite of requireRole | excluded |

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extract matchRoleRouteAccess and fix authorized early-allow</name>
  <files>src/shared/lib/match-role-route.ts, src/shared/lib/auth.config.ts</files>
  <read_first>
    - src/shared/lib/auth.config.ts — roleRoutes map, sortedRoutes loop (~73–105), redirect helpers
    - src/shared/lib/get-default-redirect.ts — TEACHER → /journal
    - entities UserRole type usage in auth.config
  </read_first>
  <behavior>
    - TEACHER + pathname /accounting/my-salary → decision allow (longest prefix wins; do not fall through to /accounting)
    - TEACHER + pathname /accounting → decision deny
    - ACCOUNTANT + pathname /accounting → allow; ACCOUNTANT + /accounting/my-salary → deny
    - No matching prefix → decision none (caller returns true)
    - Matched prefix + no session user → decision login
  </behavior>
  <action>
    1. Создать `src/shared/lib/match-role-route.ts` с экспортом:
       - типа результата вида `allow | deny | login | none` (имя на усмотрение executor, camelCase)
       - константы/карты `ROLE_ROUTES` — перенести текущий объект `roleRoutes` из `auth.config.ts` без изменения ролей/префиксов (включая `/accounting` → ACCOUNTANT и `/accounting/my-salary` → TEACHER)
       - функции `matchRoleRouteAccess(pathname, role | undefined)` (или эквивалентное имя): сортировка префиксов longest-first как сейчас; при первом совпадении `pathname === prefix || pathname.startsWith(prefix + '/')` — если нет role → `login`; если role не в списке → `deny`; иначе → `allow` и **немедленный return** (не продолжать цикл). Если совпадений нет → `none`.
    2. В `auth.config.ts` `authorized` для page routes заменить inline-цикл на вызов helper: `login` → redirect `/login`; `deny` → redirect `getDefaultRedirect(session.user.role)`; `allow` или `none` → `return true`. API/login/dashboard ветки не трогать.
    3. Не менять `getDefaultRedirect`, `requireRole`, страницы my-salary/student/me.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/shared/lib/match-role-route.test.ts</automated>
  </verify>
  <done>
    authorized больше не deny-ит TEACHER на /accounting/my-salary после allow длинного префикса; логика matching изолирована в чистой функции.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Regression unit tests for nested roleRoutes</name>
  <files>src/shared/lib/match-role-route.test.ts</files>
  <read_first>
    - src/shared/lib/match-role-route.ts — API from Task 1
    - src/shared/lib/messaging/can-message-user.test.ts — vitest style (describe/it, Russian titles ok)
    - src/shared/lib/auth.config.ts — remaining parent/child pairs in ROLE_ROUTES
  </read_first>
  <behavior>
    - TEACHER /accounting/my-salary → allow
    - TEACHER /accounting → deny
    - ACCOUNTANT /accounting → allow; ACCOUNTANT /accounting/my-salary → deny
    - TEACHER /analytics → allow; TEACHER /analytics/teachers → deny; MANAGER /analytics/teachers → allow
    - TEACHER /analytics/my-hours → allow; MANAGER /analytics/my-hours → deny
    - STUDENT /student/me → allow; TEACHER /student/me → deny
    - undefined role on protected prefix → login
    - unmatched path (e.g. /settings) → none
  </behavior>
  <action>
    Добавить `src/shared/lib/match-role-route.test.ts` по паттерну vitest проекта. Покрыть все cases из behavior, особенно пару parent/child с **разными** ролями (`/accounting` vs `/accounting/my-salary`). Также зафиксировать другие nested пары из ROLE_ROUTES с разными списками ролей (`/analytics` vs `/analytics/teachers`, `/analytics` vs `/analytics/my-hours`, `/student`). Не мокать NextAuth — только чистую функцию.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/shared/lib/match-role-route.test.ts</automated>
  </verify>
  <done>
    Все перечисленные cases зелёные; регресс «TEACHER my-salary → deny через /accounting» пойман тестом.
  </done>
</task>

<task type="auto">
  <name>Task 3: Harden AppShell selectedKey — no false Journal highlight</name>
  <files>src/widgets/app-shell/ui/AppShell.tsx</files>
  <read_first>
    - src/widgets/app-shell/ui/AppShell.tsx — selectedKey (~350–355), NavPanel selectedKeys (~293), MENU_ORDER_BY_ROLE TEACHER includes /accounting/my-salary
  </read_first>
  <action>
    Изменить вычисление `selectedKey`: оставить longest-prefix match по `menuItems` (`pathname === key || pathname.startsWith(key + '/')`), но **убрать** фолбэк `?? menuItems[0]?.key`. Если совпадений нет — `selectedKey` = `undefined`, в Menu уходит `selectedKeys={[]}` (уже поддержано тернарником `selectedKey ? [selectedKey] : []`). Не менять состав меню, иконки, роутинг. Цель: на URL вне меню роли (или чужом pathname) не подсвечивать «Журнал» как будто он активен.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/shared/lib/match-role-route.test.ts</automated>
  </verify>
  <done>
    При pathname без матча в menuItems нет selectedKeys; при /accounting/my-salary у TEACHER подсвечивается /accounting/my-salary.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Edge middleware `authorized` → dashboard pages | JWT role from session crosses into route allow/deny |
| Client AppShell selectedKey | Cosmetic only; must not grant access |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260722-wka-01 | Elevation of Privilege | matchRoleRouteAccess / accounting routes | high | mitigate | Longest-prefix allow must not fall through to parent with different roles; unit tests lock TEACHER≠ACCOUNTANT nesting |
| T-260722-wka-02 | Elevation of Privilege | /analytics/teachers vs /analytics | medium | mitigate | Same early-allow semantics; tests assert TEACHER denied on /analytics/teachers |
| T-260722-wka-03 | Information Disclosure | TEACHER on /student/* | medium | mitigate | /student remains STUDENT-only via matcher deny → default redirect |
| T-260722-wka-04 | Spoofing | authorized without session | medium | mitigate | Matched protected prefix without user → login redirect unchanged |
| T-260722-wka-05 | Tampering | AppShell selectedKey | low | accept | UI highlight only; access still enforced by middleware + requireRole on pages |
</threat_model>

<verification>
- `pnpm exec vitest run src/shared/lib/match-role-route.test.ts` — все cases зелёные
- Ручная smoke (после execute): войти как учитель → «Моя зарплата» → URL остаётся `/accounting/my-salary`, подсветка пункта «Моя зарплата»
- ACCOUNTANT по-прежнему видит `/accounting`, не получает TEACHER-only my-salary
</verification>

<success_criteria>
- Баг fall-through в roleRoutes устранён: успешный match длинного префикса завершает проверку allow
- Unit regression покрывает TEACHER `/accounting/my-salary` vs ACCOUNTANT-only `/accounting` и другие nested пары с разными ролями
- AppShell не фолбэчит selectedKey на первый пункт меню при отсутствии матча
- Страницы и requireRole не переписываются без необходимости
</success_criteria>

<output>
Create `.planning/quick/260722-wka-teacher-salary-nav-bug/260722-wka-SUMMARY.md` when done
</output>
