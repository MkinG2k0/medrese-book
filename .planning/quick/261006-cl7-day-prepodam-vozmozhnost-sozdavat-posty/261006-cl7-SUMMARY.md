---
quick_id: 261006-cl7
slug: day-prepodam-vozmozhnost-sozdavat-posty
phase: 261006-cl7
plan: 01
subsystem: posts
tags: [posts, teacher, news, rbac, e2e]
status: complete
date: 2026-10-06
taiga_url:

requires: []
provides:
  - TEACHER may POST GENERAL news on /api/posts
  - TEACHER PATCH/DELETE only own posts
  - NewsFeedPage Create + per-post canManage for teachers
  - Teacher help news copy and e2e for GENERAL publish
affects: [posts, help]

actuals:
  tokens: 5809
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - Teacher write roles reuse authorizeApiRequest allowedRoles plus authorId ownership
    - UI splits canCreate vs canChoosePostType; payload.type forced GENERAL for teachers

key-files:
  created: []
  modified:
    - src/app/api/posts/route.ts
    - src/app/api/posts/[id]/route.ts
    - src/features/posts/ui/NewsFeedPage.tsx
    - src/features/help/model/teacher-guide.ts
    - e2e/posts.spec.ts

key-decisions:
  - "TEACHER + SYSTEM on POST/PATCH returns 400 with Russian copy, not 403"
  - "Teacher Upload accept jpeg/png/webp only; /api/uploads MIME unchanged"
  - "Missing post stays 404; non-author teacher gets forbidden()"

patterns-established:
  - "canCreate for TEACHER|MANAGER|SUPER_ADMIN; canChoosePostType only for managers"
  - "loadPostForMutation selects authorId and gates TEACHER writes"

requirements-completed: [QUICK-261006-cl7]

coverage:
  - id: D1
    description: "Teacher POST /api/posts allowed; SYSTEM body returns 400"
    requirement: QUICK-261006-cl7
    verification:
      - kind: other
        ref: "rg allowedRoles + SYSTEM 400 message in src/app/api/posts/route.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "NewsFeedPage Create for teacher, no type Radio, GENERAL submit, image-only accept"
    requirement: QUICK-261006-cl7
    verification:
      - kind: other
        ref: "rg canCreate|canChoosePostType|image/jpeg,image/png,image/webp in NewsFeedPage.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "Teacher PATCH/DELETE own posts only; 403/404; per-post canManage"
    requirement: QUICK-261006-cl7
    verification:
      - kind: other
        ref: "rg authorId/forbidden in src/app/api/posts/[id]/route.ts; post.author.id in NewsFeedPage.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "Teacher help copy + Playwright teacher Create/GENERAL/no SYSTEM radio; student still no Create"
    requirement: QUICK-261006-cl7
    verification:
      - kind: e2e
        ref: "playwright:e2e/posts.spec.ts --project=chromium"
        status: unknown
    human_judgment: true
    rationale: "Playwright CLI cannot load playwright.config.ts in this agent shell (context.conditions?.includes is not a function)"

duration: 20min
completed: 2026-10-06
---

# Phase 261006-cl7 Plan 01: Teacher news create Summary

**Teachers can publish ordinary GENERAL news on /news; SYSTEM type and other authors' posts stay manager-only**

## Performance

- **Duration:** 20 min
- **Started:** 2026-10-06T06:09:00Z
- **Completed:** 2026-10-06T06:30:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- POST `/api/posts` accepts TEACHER; `type: SYSTEM` from a teacher returns 400 «Учитель может создавать только обычные публикации»
- PATCH/DELETE `/api/posts/[id]` allow TEACHER only when `authorId === session.user.id`; missing row 404; managers still mutate all
- `/news` shows «Создать» for teachers without Radio «Тип поста»; teacher Upload accept is jpeg/png/webp; cards expose edit/delete only on own posts
- Teacher help news section describes publishing ordinary news; e2e teacher describe publishes GENERAL and asserts no type radios

## Task Commits

1. **Task 1: Teacher publishes GENERAL news end-to-end** - `a4594a0` (feat)
2. **Task 2: Teacher edit/delete only own posts** - `0b57df4` (feat)
3. **Task 3: Teacher help copy and posts e2e** - `b4a6e6b` (test)

## Files Created/Modified

- `src/app/api/posts/route.ts` — TEACHER on POST; SYSTEM rejected with 400
- `src/app/api/posts/[id]/route.ts` — TEACHER on PATCH/DELETE with authorId ownership
- `src/features/posts/ui/NewsFeedPage.tsx` — canCreate, canChoosePostType, per-post canManage, image-only accept
- `src/features/help/model/teacher-guide.ts` — news copy for teacher publishing
- `e2e/posts.spec.ts` — teacher Create + GENERAL; student still no Create; manager SYSTEM kept

## Decisions Made

- Reused `error()` / `forbidden()` helpers; kept 404 wording «Публикация не найдена»
- Did not loosen `/api/uploads` MIME for TEACHER (D-05)
- Teacher PATCH of `type: SYSTEM` uses the same 400 message as POST

## Deviations from Plan

None - plan executed exactly as written.

Pre-existing environment issues (not auto-fixed, out of scope):

- `tsc --noEmit` fails in `src/shared/lib/notifications/build-notification.ts` (`TUITION_PAYMENT_REQUEST_CREATED` not in `NotificationType`)
- Playwright CLI cannot load `playwright.config.ts` in this agent shell (`context.conditions?.includes is not a function`), same as 261006-ck6

## Issues Encountered

- Playwright verification could not run in this shell; spec was still rewritten per D-06. See deferred-items.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Teachers can create ordinary news; managers still own SYSTEM posts
- Re-run `pnpm exec playwright test e2e/posts.spec.ts --project=chromium` outside this agent shell

## Known Stubs

None.

## Self-Check: PASSED

- SUMMARY.md, META.json, and all modified source files exist
- Commits `a4594a0`, `0b57df4`, `b4a6e6b` exist on master

---
*Phase: 261006-cl7*
*Completed: 2026-10-06*
