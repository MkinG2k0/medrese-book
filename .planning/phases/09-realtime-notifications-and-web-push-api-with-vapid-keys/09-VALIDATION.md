---
phase: 9
slug: realtime-notifications-and-web-push-api-with-vapid-keys
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-25
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit), Playwright 1.61.0 (E2E) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm test:unit` |
| **Full suite command** | `pnpm test:unit && pnpm test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit`
- **After every plan wave:** Run `pnpm test:e2e e2e/notifications.spec.ts` (when created in 09-05)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | NOTF-04 | T-9-01 | enqueue creates rows scoped to recipients | unit | `pnpm test:unit -- src/shared/lib/notifications/build-notification.test.ts` | ✅ | ✅ green |
| 09-01-02 | 01 | 1 | NOTF-04 | — | migration applies Notification model | manual | `pnpm db:migrate` | — | ✅ green |
| 09-02-01 | 02 | 2 | NOTF-01 | T-9-02 | unread count API filters by session.user.id | E2E | `pnpm test:e2e e2e/notifications.spec.ts` | ✅ | ✅ green |
| 09-02-02 | 02 | 2 | NOTF-02 | T-9-02 | mark-read only own notifications | E2E | same | ✅ | ✅ green |
| 09-03-01 | 03 | 3 | NOTF-05 | T-9-03 | SSE stream requires auth | unit/E2E | `pnpm test:e2e e2e/notifications.spec.ts` | ✅ | ✅ green |
| 09-04-01 | 04 | 4 | NOTF-06 | T-9-04 | push subscription bound to userId | unit | `pnpm test:unit -- src/shared/lib/push/send-push.test.ts` | ✅ | ✅ green |
| 09-05-01 | 05 | 5 | NOTF-01..04 | — | leave → manager bell E2E | E2E | `pnpm test:e2e e2e/notifications.spec.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `e2e/notifications.spec.ts` — bell, realtime, leave integration
- [x] `e2e/helpers/notifications.ts` — DB helpers for Notification table
- [x] `src/shared/lib/notifications/build-notification.test.ts` — copy/recipients
- [x] `src/shared/lib/push/send-push.test.ts` — mocked web-push
- [x] `.env.test.example` — VAPID_* placeholders
- [x] `web-push` dependency — Wave 09-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OS-level Web Push notification | NOTF-06 | Playwright cannot assert native push | HTTPS staging: subscribe, trigger leave event, confirm OS notification |
| Service worker registration | NOTF-06 | Browser permission dialog | DevTools → Application → Service Workers shows `/sw.js` active |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for `/gsd-verify-work`

**NOTF-03:** отложено — см. [09-DEFERRED.md](./09-DEFERRED.md)
