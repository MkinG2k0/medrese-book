---
status: awaiting_human_verify
trigger: |
  при переключении учеток в селекте кидает на такой экран
  щашел в админа , перешел в учителя все норм потом еще раз перешел в другого учтилея и вылетает на этот экран
  (screenshot: ERR_ADDRESS_INVALID https://0.0.0.0:3000/login?reason=idle; Network: my-group 303 → Dashboard 307 → login?reason=idle canceled)
created: 2026-10-08
updated: 2026-10-08T14:46:00+03:00
---

# Debug: switch-user-idle-logout

## Symptoms

- **Expected:** Admin → Teacher A → Teacher B via UserSwitcher keeps session; lands on dashboard/my-group for Teacher B
- **Actual:** Second switch (teacher → another teacher) redirects to `https://0.0.0.0:3000/login?reason=idle` with ERR_ADDRESS_INVALID
- **Errors:** ERR_ADDRESS_INVALID; Network: POST my-group 303, GET Dashboard 307, GET login?reason=idle canceled
- **Timeline:** Repro on account switch after already being a teacher (first admin→teacher OK)
- **Reproduction:** Login as admin → switch to teacher → switch to different teacher → broken idle login URL

## Current Focus

```yaml
bug_class: Bohrbug
hypothesis: CONFIRMED — mismatch→expire + absolute redirect from request.url
status: awaiting_human_verify
next_action: "User confirms Admin→Teacher A→Teacher B keeps session without idle logout / 0.0.0.0"
```

## Evidence

- 2026-10-08: Screenshot shows login?reason=idle and 0.0.0.0:3000
- 2026-10-08: `teacher-idle.ts` L120-122: `parsed.userId !== input.userId` → `{action: 'expire'}` (test asserts this)
- 2026-10-08: `switch-user-actions.ts` signIn + redirect('/dashboard') — no idle cookie refresh
- 2026-10-08: `idle-expire/route.ts` L95: `new URL(TEACHER_IDLE_LOGOUT_PATH, request.url)` — inherits 0.0.0.0 host
- 2026-10-08: Idle only applies to TEACHER role — explains admin→teacher OK (no cookie / skip), teacher→teacher fails
- 2026-10-08: Confirmed `withTeacherIdleCookie` sets new cookie only on `bump`; dashboard GET after switch is bump-eligible
- 2026-10-08: Knowledge base absent; mempalace search no prior match
- 2026-10-08: After fix, vitest teacher-idle + idle-session: 22/22 pass
- 2026-10-08: Revert-and-reconfirm: with pre-fix teacher-idle.ts, mismatch tests fail (expire vs bump/allow); reapply → pass

## Eliminated

None yet.

## Resolution

- **root_cause:** After switchUser (Teacher A→B), `teacher_last_active` remains HMAC-signed for A; `decideTeacherIdleAction` treats `parsed.userId !== session.userId` as expire → rewrite to idle-expire → logout. Secondary: `idleExpireResponse` used `new URL(..., request.url)` so Docker/dev bind host `0.0.0.0` became the browser redirect target (ERR_ADDRESS_INVALID). Admin→Teacher works because MANAGER skips idle or cookie is freshly initialized.
- **fix:** Treat valid-signature userId mismatch like missing cookie (bump/allow to re-bind); keep invalid HMAC as expire. Idle logout redirect uses relative Location `/login?reason=idle` instead of absolute URL from request.url.
- **verification:**
  ```yaml
  target_test: { result: pass, suites: ["src/shared/lib/teacher-idle.test.ts mismatch→bump/allow"] }
  mutation_check: { result: skipped, reason_if_skipped: "Stryker not configured" }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false, note: "behavior change + redirect harden, not deletion-only" }
  adjacent_tests: { result: pass, suites_run: ["teacher-idle.test.ts", "idle-session.test.ts"] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
  guardrail_verdict: accepted
  ```
- **files_changed:**
  - src/shared/lib/teacher-idle.ts
  - src/shared/lib/teacher-idle.test.ts
  - src/app/api/auth/idle-expire/route.ts
- **oracle_type:** specified (JWT session is source of truth after switchUser; leftover idle cookie for prior teacher must re-init, not logout)
