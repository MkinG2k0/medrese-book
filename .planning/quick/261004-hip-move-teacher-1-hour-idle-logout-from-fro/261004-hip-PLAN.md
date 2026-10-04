---
quick_id: 261004-hip
slug: move-teacher-1-hour-idle-logout-from-fro
phase: 261004-hip
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/lib/teacher-idle.ts
  - src/shared/lib/teacher-idle.test.ts
  - src/shared/lib/auth.config.ts
  - src/shared/api/index.ts
  - src/app/api/auth/idle-expire/route.ts
  - src/features/auth/lib/idle-session.ts
  - src/widgets/app-shell/ui/AppShell.tsx
  - src/features/auth/ui/IdleSessionGuard.tsx
  - src/shared/providers/query-provider.tsx
  - package.json
  - pnpm-lock.yaml
  - e2e/auth.spec.ts
  - e2e/helpers/teacher-idle.ts
autonomous: true
requirements:
  - QUICK-261004-hip
user_setup: []
estimate:
  tokens: 45000
  raw_tokens: 45000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - "Учитель с просроченной signed last-active cookie при навигации попадает на /login?reason=idle и видит Alert «Сессия завершена из-за неактивности»"
    - "Таймаут учителя — 1 час; менеджер и остальные роли не разлогиниваются по idle"
    - "SSE, unread/messages polls, GET /api/teaching-sessions и GET /api/auth/session не продлевают last-active; document-навигации и POST/PATCH/PUT/DELETE продлевают"
    - "При idle сервер очищает session cookie, завершает активный урок и пишет USER_LOGOUT; API отвечает 401 с reason idle"
    - "Клиентский idle-timer больше не монтируется в AppShell"
  artifacts:
    - path: src/shared/lib/teacher-idle.ts
      provides: "HMAC cookie + shouldBumpTeacherActivity + decideTeacherIdleAction (Edge-safe, no Prisma)"
      exports:
        - TEACHER_IDLE_TIMEOUT_MS
        - TEACHER_IDLE_LOGOUT_PATH
        - TEACHER_LAST_ACTIVE_COOKIE
        - shouldBumpTeacherActivity
        - decideTeacherIdleAction
        - signTeacherLastActiveValue
        - parseTeacherLastActiveValue
    - path: src/app/api/auth/idle-expire/route.ts
      provides: "Node handler: end lesson + logout audit + clear cookies + redirect or 401"
      exports: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    - path: src/shared/lib/auth.config.ts
      provides: "authorized() enforces teacher idle and sets activity cookie via NextResponse.next()"
    - path: e2e/helpers/teacher-idle.ts
      provides: "Playwright helper to plant an expired signed last-active cookie"
  key_links:
    - from: src/shared/lib/auth.config.ts
      to: src/shared/lib/teacher-idle.ts
      via: "authorized() calls decideTeacherIdleAction then rewrite to /api/auth/idle-expire"
      pattern: "idle-expire"
    - from: src/app/api/auth/idle-expire/route.ts
      to: src/features/journal/lib/teaching-session-queries.ts
      via: "findActiveTeachingSession + LESSON_ENDED then recordUserLogout then signOut"
      pattern: "LESSON_ENDED"
    - from: e2e/auth.spec.ts
      to: e2e/helpers/teacher-idle.ts
      via: "plant expired cookie then navigate /journal"
      pattern: "reason=idle"
---

<objective>
Move teacher 1-hour idle logout from a client timer to backend-enforced signed last-active state. Per D-01 only TEACHER. Per D-02 timeout stays 3600000 ms. Per D-03 keep /login?reason=idle and the existing LoginForm Alert copy. Per D-04/D-05 persist activity in an HMAC cookie, not JWT. Per D-06/D-07 bump on real activity only. Per D-08 expire clears the session, redirects or 401s, ends the lesson, and audits logout on the server. Per D-09 remove the AppShell client timer. Per D-10 other roles unchanged. Per D-11 replace Playwright clock.fastForward with a signed-cookie aging helper.

Purpose: Polls and SSE currently keep the teacher "active" in the browser timer; idle must follow real teaching work and must close the lesson even if the tab never fires onIdle.
Output: shared idle helpers, middleware enforcement, Node expire route, client timer removed, E2E via expired cookie.
</objective>

<execution_context>
@C:/Users/mk/.cursor/gsd-core/workflows/execute-plan.md
@C:/Users/mk/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/shared/lib/auth.config.ts
@src/shared/lib/auth.ts
@middleware.ts
@src/features/auth/lib/idle-session.ts
@src/features/auth/lib/sign-out.ts
@src/features/auth/ui/LoginForm.tsx
@src/app/(auth)/login/page.tsx
@src/app/api/teaching-sessions/end-active/route.ts
@src/features/journal/lib/teaching-session-queries.ts
@src/features/auth/lib/auth-audit.ts
@src/shared/api/index.ts
@src/widgets/app-shell/ui/AppShell.tsx
@src/shared/providers/query-provider.tsx
@e2e/auth.spec.ts
@e2e/helpers/auth.ts
</context>

<interfaces>
From src/shared/lib/auth.config.ts:
- session strategy is jwt; jwt callback sets id, role, teacherId, studentId, switchOwnerId only
- authorized({auth, request}) already returns NextResponse.json 401 for unmatched API without session, and NextResponse.redirect for pages
- returning boolean true cannot attach Set-Cookie; teacher allow/bump paths must return NextResponse.next()

From src/shared/api/index.ts:
- JSON shape { data, error }; unauthorized() is 401 «Требуется авторизация»
- Add unauthorizedIdle() as 401 with error «Сессия завершена из-за неактивности» and reason: 'idle' (extra field is OK)

From src/app/api/teaching-sessions/end-active/route.ts:
- TEACHER-only; findActiveTeachingSession(teacherId); prisma transaction updates endedAt; dispatchDomainEvent action LESSON_ENDED, payload.reason currently 'logout'
- Idle expire reuses this sequence with payload.reason 'idle' and actorId = session.user.id

From src/features/auth/lib/auth-audit.ts:
- recordUserLogout(userId, role) dispatches USER_LOGOUT — call it directly from idle-expire, do not HTTP-call /api/auth/logout-audit

From src/features/auth/lib/idle-session.ts:
- TEACHER_IDLE_TIMEOUT_MS = 60 * 60 * 1000; TEACHER_IDLE_LOGOUT_CALLBACK = '/login?reason=idle'; isTeacherIdleLogoutEnabled(role) === role === 'TEACHER'
- After move: re-export these from src/shared/lib/teacher-idle.ts so idle-session.test.ts still passes

From LoginForm:
- logoutReason === 'idle' shows Alert type info title «Сессия завершена из-за неактивности» — do not change copy or the login page searchParams.reason wiring

From middleware.ts:
- matcher excludes api/auth (so GET /api/auth/session never hits authorized). Do not widen matcher. Encode session-path in shouldBump anyway for unit tests.

Cookie contract (new, Edge-safe Web Crypto HMAC-SHA256, AUTH_SECRET ?? NEXTAUTH_SECRET):
- name: teacher_last_active
- value: userId.epochMs.base64url(hmac)
- message to sign: userId.epochMs
- httpOnly, path=/, sameSite=lax, secure when request URL protocol is https, maxAge 7 days (must outlive the 1h idle window so a stale timestamp can still be read)
- invalid signature or userId !== session.user.id => expire
- missing cookie on a bump request => set now (not expire), so deploy does not mass-logout
- missing cookie on a no-bump request => allow, do not set

decideTeacherIdleAction input: { role, userId, method, pathname, cookieHeader, prefetchHeader, purposeHeader, nowMs, secret }
result: { action: 'skip' | 'allow' | 'bump' | 'expire', ts?: number }
- skip: role is not TEACHER (D-01, D-10)
- expire: TEACHER and (bad cookie or ts older than TEACHER_IDLE_TIMEOUT_MS)
- bump: TEACHER, not expired, shouldBumpTeacherActivity true
- allow: TEACHER, not expired, shouldBump false
</interfaces>

## Source Coverage Audit

| SOURCE | ID | Feature | Plan | Status | Notes |
|--------|----|---------|------|--------|-------|
| GOAL | — | Backend lastActive idle for teachers | 01 | COVERED | Tasks 1–3 |
| REQ | QUICK-261004-hip | Move idle logout off client timer | 01 | COVERED | |
| CONTEXT | D-01 | Only TEACHER | 01 | COVERED | Task 1 skip non-teachers |
| CONTEXT | D-02 | Timeout 1 hour | 01 | COVERED | TEACHER_IDLE_TIMEOUT_MS |
| CONTEXT | D-03 | /login?reason=idle + Alert | 01 | COVERED | expire redirect + unchanged LoginForm |
| CONTEXT | D-04 | Signed cookie preferred | 01 | COVERED | teacher_last_active HMAC |
| CONTEXT | D-05 | No JWT activity field | 01 | COVERED | jwt callback unchanged |
| CONTEXT | D-06 | Bump nav + mutating methods | 01 | COVERED | shouldBumpTeacherActivity |
| CONTEXT | D-07 | No bump on SSE/polls/session GET | 01 | COVERED | skip list |
| CONTEXT | D-08 | Clear session, 401/redirect, end lesson, audit | 01 | COVERED | idle-expire route |
| CONTEXT | D-09 | Remove AppShell client timer; optional 401 redirect | 01 | COVERED | Task 2 |
| CONTEXT | D-10 | Other roles unchanged | 01 | COVERED | skip + manager E2E |
| CONTEXT | D-11 | Server-side E2E aging path | 01 | COVERED | Task 3 cookie helper |
| CONTEXT | D-12 | Russian UI, FSD, neighbor style | 01 | COVERED | helpers in shared for middleware |
| CONTEXT | D-13 | Atomic commits per task; no .planning commits | 01 | COVERED | executor rule |
| RESEARCH | — | none | — | n/a | quick mode, no research |
| Deferred | — | none | — | n/a | |

Discretion (not locked): treat Next-Router-Prefetch=1 and Purpose=prefetch as no-bump so sidebar prefetch does not reset idle. Use QueryCache onError for optional idle 401 redirect.

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Signed last-active cookie through middleware to idle-expire</name>
  <files>src/shared/lib/teacher-idle.ts, src/shared/lib/teacher-idle.test.ts, src/shared/lib/auth.config.ts, src/shared/api/index.ts, src/app/api/auth/idle-expire/route.ts, src/features/auth/lib/idle-session.ts</files>
  <read_first>
    - src/shared/lib/auth.config.ts — authorized branches for /api, /login, role routes
    - src/app/api/teaching-sessions/end-active/route.ts — LESSON_ENDED transaction
    - src/features/journal/lib/teaching-session-queries.ts — findActiveTeachingSession
    - src/features/auth/lib/auth-audit.ts — recordUserLogout
    - src/shared/api/index.ts — error/unauthorized helpers
    - src/features/auth/lib/idle-session.ts — re-export target
  </read_first>
  <behavior>
    - TEACHER_IDLE_TIMEOUT_MS is 3600000 (D-02); isTeacherIdleLogoutEnabled is true only for TEACHER (D-01)
    - Fresh cookie + GET /journal => bump; stale cookie + GET /journal => expire
    - Fresh cookie + GET /api/notifications/stream, GET /api/notifications/unread-count, GET /api/conversations, GET /api/conversations/x/messages, GET /api/teaching-sessions, GET /api/auth/session => allow (D-07)
    - Fresh cookie + POST /api/teaching-sessions => bump (D-06)
    - Fresh cookie + GET /journal with Next-Router-Prefetch=1 => allow
    - Stale cookie + GET /api/notifications/unread-count => expire (enforce, do not bump)
    - Invalid HMAC or userId mismatch => expire
    - Missing cookie + GET /journal => bump (initialize)
    - MANAGER => skip regardless of cookie
    - sign/parse round-trip returns the same userId and epochMs
  </behavior>
  <action>
    Create Edge-safe helpers in src/shared/lib/teacher-idle.ts (no Prisma, no features imports) per D-04. Use Web Crypto HMAC-SHA256 with AUTH_SECRET so auth.config stays Edge-compatible. Do not add activity timestamps to the jwt or session callbacks per D-05.

    shouldBumpTeacherActivity per D-06/D-07: bump mutating POST/PATCH/PUT/DELETE; bump GET/HEAD whose pathname does not start with /api/; never bump the passive list (notifications stream, unread-count, /api/conversations and nested messages GET, GET /api/teaching-sessions, GET /api/auth/session); never bump when Next-Router-Prefetch is 1 or Purpose is prefetch.

    Write src/shared/lib/teacher-idle.test.ts first (RED then GREEN) covering the behavior list. Re-export timeout, callback path, and isTeacherIdleLogoutEnabled from src/features/auth/lib/idle-session.ts so existing idle-session.test.ts keeps passing (callback path stays /login?reason=idle per D-03).

    In authorized() after a session exists: if decideTeacherIdleAction is skip, keep current boolean/redirect behavior for that role (D-10). If expire, NextResponse.rewrite to /api/auth/idle-expire with search param from set to the original pathname (preserve method). If bump, NextResponse.next() plus Set-Cookie of a freshly signed value. If allow, NextResponse.next() without rewriting the cookie. Non-teacher success paths may still return true.

    Add unauthorizedIdle() in src/shared/api/index.ts: 401 JSON { data: null, error: «Сессия завершена из-за неактивности», reason: 'idle' } per D-08.

    Create src/app/api/auth/idle-expire/route.ts with runtime nodejs and the same handler for GET/POST/PUT/PATCH/DELETE. Per D-08: auth(); if no session redirect to /login?reason=idle; if TEACHER with teacherId, end the active teaching session using the same prisma+dispatchDomainEvent pattern as end-active but payload.reason 'idle'; always recordUserLogout(session.user.id, session.user.role); signOut({ redirect: false }); clear teacher_last_active on the outgoing response; if from starts with /api/ return unauthorizedIdle(); else redirect to /login?reason=idle. Copy Set-Cookie from signOut onto that redirect/401 so the JWT session cookie is actually cleared. Matcher already excludes api/auth so this route does not loop. Do not commit .planning files (D-13).
  </action>
  <verify>
    <automated>pnpm exec vitest run src/shared/lib/teacher-idle.test.ts src/features/auth/lib/idle-session.test.ts</automated>
  </verify>
  <done>
    Unit tests pass. Teacher idle decision lives in shared and is invoked from authorized(). Expire route ends the lesson, audits logout, clears cookies, and redirects pages to /login?reason=idle or returns 401 reason idle for API from= paths. jwt callback fields unchanged.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Remove client idle timer and redirect on idle 401</name>
  <files>src/widgets/app-shell/ui/AppShell.tsx, src/features/auth/ui/IdleSessionGuard.tsx, src/shared/providers/query-provider.tsx, package.json, pnpm-lock.yaml</files>
  <read_first>
    - src/widgets/app-shell/ui/AppShell.tsx — idle guard usage near the Layout root
    - src/shared/providers/query-provider.tsx — QueryClient defaultOptions
    - src/features/auth/ui/LoginForm.tsx — Alert must stay
  </read_first>
  <behavior>
    - AppShell no longer mounts a client idle-timer child
    - package.json dependencies no longer list the idle-timer library
    - QueryClient does not retry an error whose message is «Сессия завершена из-за неактивности»
    - QueryCache/MutationCache onError assigns window.location to /login?reason=idle for that message (D-09 optional handler)
  </behavior>
  <action>
    Per D-09: delete src/features/auth/ui/IdleSessionGuard.tsx; remove its import and JSX from AppShell. Keep signOutWithLessonCleanup for the manual Выйти button. Uninstall the client idle-timer dependency (pnpm remove) and refresh the lockfile.

    Per D-09 optional 401 handler: in QueryProvider, on QueryCache and MutationCache onError, if error.message is «Сессия завершена из-за неактивности», call window.location.assign('/login?reason=idle'). Set queries.retry so that message is not retried. Do not change LoginForm Alert or login/page.tsx (D-03). Do not add idle logic for MANAGER/STUDENT/PARENT/ACCOUNTANT/SUPER_ADMIN (D-10). Do not commit .planning files (D-13).
  </action>
  <verify>
    <automated>pnpm exec vitest run src/shared/lib/teacher-idle.test.ts src/features/auth/lib/idle-session.test.ts; pnpm exec tsc --noEmit -p tsconfig.json</automated>
  </verify>
  <done>
    AppShell has no client idle-timer child; the idle-timer package is gone from dependencies; LoginForm idle Alert is unchanged; React Query idle 401 navigates to /login?reason=idle without retry.
  </done>
</task>

<task type="auto">
  <name>Task 3: E2E idle via expired signed cookie</name>
  <files>e2e/helpers/teacher-idle.ts, e2e/auth.spec.ts</files>
  <read_first>
    - e2e/auth.spec.ts — current teacher/manager idle tests using clock.fastForward
    - e2e/helpers/auth.ts — loginAs
    - playwright.config.ts — AUTH_SECRET loaded from .env.test
    - src/shared/lib/teacher-idle.ts — signTeacherLastActiveValue, cookie name, timeout
  </read_first>
  <action>
    Per D-11: Playwright clock.fastForward cannot age a server cookie. Add e2e/helpers/teacher-idle.ts that imports signTeacherLastActiveValue (relative path to src/shared/lib/teacher-idle.ts) and AUTH_SECRET from env, then context.addCookies an httpOnly teacher_last_active value with epochMs = Date.now() - TEACHER_IDLE_TIMEOUT_MS - 1000 for the logged-in user id.

    After loginAs(teacher1), GET /api/auth/session (or page.request) to read user.id, plant the expired cookie, then page.goto('/journal'). Expect URL /login?reason=idle and visible text «Сессия завершена из-за неактивности» (D-03).

    Manager test: loginAs(manager), plant the same expired cookie if a session user id exists, page.goto('/admin/users'), stay on /admin/users with heading «Пользователи» (D-10). Do not use context.clock.

    Keep production timeout hardcoded at 1 hour (D-02); do not add a test-env shorter timeout. Do not commit .planning files (D-13).
  </action>
  <verify>
    <automated>pnpm exec playwright test e2e/auth.spec.ts --project=chromium</automated>
  </verify>
  <done>
    Teacher with an expired signed last-active cookie is sent to /login?reason=idle with the idle Alert. Manager remains on /admin/users. No Playwright clock.fastForward in these tests.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → middleware authorized() | Untrusted Cookie header and method/path; JWT session already verified by Auth.js |
| Edge middleware → /api/auth/idle-expire | Internal rewrite; still carries the not-yet-cleared session cookie |
| idle-expire → Postgres | Ends TeachingSession and writes USER_LOGOUT / LESSON_ENDED |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-hip-01 | Tampering | teacher_last_active cookie | high | mitigate | HMAC-SHA256 with AUTH_SECRET; bad signature or userId mismatch expires the session (D-04) |
| T-hip-02 | Elevation of Privilege | idle check on non-teachers | medium | mitigate | decideTeacherIdleAction skip unless role TEACHER (D-01, D-10) |
| T-hip-03 | Spoofing | idle-expire route | high | mitigate | Requires current auth() session; only ends that teacher's lesson; then signOut |
| T-hip-04 | Denial of Service | Next.js Link prefetch resetting activity | medium | mitigate | Prefetch headers do not bump last-active |
| T-hip-05 | Information Disclosure | 401 body reason idle | low | accept | Same copy already shown on /login?reason=idle |
| T-hip-06 | Repudiation | idle logout without audit | medium | mitigate | recordUserLogout + LESSON_ENDED reason idle on the server (D-08) |
| T-hip-SC | Tampering | npm installs | low | accept | No new packages; one dependency removed |
</threat_model>

<verification>
- pnpm exec vitest run src/shared/lib/teacher-idle.test.ts src/features/auth/lib/idle-session.test.ts
- pnpm exec tsc --noEmit -p tsconfig.json
- pnpm exec playwright test e2e/auth.spec.ts --project=chromium
</verification>

<success_criteria>
- Teacher idle is enforced from signed last-active cookie in authorized(), not from a client timer
- Passive polls/SSE/session GET do not extend the 1-hour window; real navigations and mutations do
- Idle teacher lands on /login?reason=idle with the existing Alert; API gets 401 reason idle; active lesson is closed and logout is audited
- Manager idle behavior unchanged
- E2E plants an expired HMAC cookie instead of fast-forwarding the browser clock
</success_criteria>

<output>
Create `.planning/quick/261004-hip-move-teacher-1-hour-idle-logout-from-fro/261004-hip-SUMMARY.md` when done (status: complete). Atomic commits per task; do not commit `.planning/` docs.
</output>
