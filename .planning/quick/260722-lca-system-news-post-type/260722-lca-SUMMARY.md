---
phase: 260722-lca-system-news-post-type
plan: 01
subsystem: posts
tags: [prisma, post-type, notifications, news, e2e]

requires: []
provides:
  - PostType GENERAL|SYSTEM with Post.type default GENERAL
  - Role-based visibility helpers and API guards for SYSTEM posts
  - SYSTEM POST_PUBLISHED notifies non-students only
  - Manager Radio «Тип поста» and Tag «Системная»
affects: [news-feed, notifications]

tech-stack:
  added: []
  patterns:
    - "post-visibility helpers for Prisma where + assertPostVisibleToRole"
    - "SYSTEM notification recipient filter via role: { not: STUDENT }"

key-files:
  created:
    - prisma/migrations/20260722122630_add_post_type/migration.sql
    - src/shared/lib/posts/post-visibility.ts
  modified:
    - prisma/schema.prisma
    - src/shared/lib/validations/post.ts
    - src/shared/lib/posts/post-dto.ts
    - src/app/api/posts/route.ts
    - src/app/api/posts/[id]/route.ts
    - src/app/api/posts/[id]/like/route.ts
    - src/shared/lib/notifications/enqueue-notifications.ts
    - src/features/posts/ui/NewsFeedPage.tsx
    - src/features/posts/ui/PostCard.tsx
    - e2e/posts.spec.ts

key-decisions:
  - "Enum PostType { GENERAL SYSTEM } with Post.type @default(GENERAL)"
  - "STUDENT: list filter + 404 on get/like for SYSTEM (no info leak)"
  - "SYSTEM POST_PUBLISHED: user.findMany where role not STUDENT"

patterns-established:
  - "Visibility: postVisibilityWhere(role) + assertPostVisibleToRole(type, role)"
  - "UI: Radio for two post types; plain Tag without custom colors"

requirements-completed: [QUICK-system-news-post-type]

coverage:
  - id: D1
    description: "Менеджер выбирает тип поста Обычная/Системная при создании и редактировании"
    requirement: QUICK-system-news-post-type
    verification:
      - kind: e2e
        ref: "playwright: e2e/posts.spec.ts — может опубликовать системную новость с тегом"
        status: pass
    human_judgment: false
  - id: D2
    description: "STUDENT не видит SYSTEM в ленте; учитель видит"
    requirement: QUICK-system-news-post-type
    verification:
      - kind: e2e
        ref: "playwright: e2e/posts.spec.ts — учитель видит SYSTEM, ученик — нет"
        status: pass
    human_judgment: false
  - id: D3
    description: "Миграция ADD COLUMN type DEFAULT GENERAL без destructive ops"
    requirement: QUICK-system-news-post-type
    verification:
      - kind: other
        ref: "prisma/migrations/20260722122630_add_post_type/migration.sql"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-22
status: complete
---

# Phase 260722-lca: System news post type Summary

**Тип поста GENERAL|SYSTEM: менеджер выбирает в модалке; SYSTEM скрыт от учеников в API/ленте и в POST_PUBLISHED уведомлениях.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-22T12:25:00Z
- **Completed:** 2026-07-22T12:40:00Z
- **Tasks:** 3/3
- **Files modified:** 12

## Accomplishments

- Prisma `PostType` + безопасная миграция `ADD COLUMN type DEFAULT 'GENERAL'`
- API visibility (list/get/like) и фильтр получателей SYSTEM-уведомлений
- UI Radio «Тип поста» + Tag «Системная»; e2e по ролям зелёный

## Task Commits

1. **Task 1: PostType schema, Zod, DTO contract** - `593a2d5` (feat)
2. **Task 2: API visibility, create/update type, SYSTEM notifications** - `6a24297` (feat)
3. **Task 3: Create/edit Radio, SYSTEM Tag, e2e** - `eb3057d` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — enum PostType, Post.type
- `prisma/migrations/20260722122630_add_post_type/migration.sql` — CREATE TYPE + ADD COLUMN
- `src/shared/lib/posts/post-visibility.ts` — where + assert helpers
- `src/shared/lib/validations/post.ts` — type in create/update schemas
- `src/shared/lib/posts/post-dto.ts` — PostDto.type + select
- `src/app/api/posts/route.ts` — list filter, persist type, event payload
- `src/app/api/posts/[id]/route.ts` — PATCH type, GET 404 guard
- `src/app/api/posts/[id]/like/route.ts` — like 404 guard
- `src/shared/lib/notifications/enqueue-notifications.ts` — SYSTEM recipient filter
- `src/features/posts/ui/NewsFeedPage.tsx` — Radio «Тип поста»
- `src/features/posts/ui/PostCard.tsx` — Tag «Системная»
- `e2e/posts.spec.ts` — SYSTEM create + role visibility

## Decisions Made

- Followed locked plan decisions (PostType enum, visibility helpers, Zod default GENERAL, Russian UI).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Temporary type in create payload for tsc after Zod change**
- **Found during:** Task 1
- **Issue:** NewsFeedPage payloads missing required `type` after schema change
- **Fix:** Added default `type: 'GENERAL'` until Task 3 Radio state; then wired to `postType`
- **Files modified:** `NewsFeedPage.tsx`
- **Verification:** `tsc --noEmit` passed
- **Committed in:** `593a2d5` / superseded by `eb3057d`

**2. [Rule 3 - Blocking] Stale Next.js Prisma client during e2e**
- **Found during:** Task 3 verify
- **Issue:** Running `next dev` still used pre-generate client (`Unknown argument type`)
- **Fix:** Restarted dev server after `prisma generate`; e2e re-run passed
- **Files modified:** none (runtime)
- **Verification:** `playwright test e2e/posts.spec.ts` — 12 passed

## Verification Results

- `pnpm exec prisma validate` — OK
- `pnpm exec tsc --noEmit -p tsconfig.json` — OK
- `pnpm exec playwright test e2e/posts.spec.ts --reporter=line` — 12 passed
  - Note: ran with `E2E_SKIP_SEED=1` and existing `localhost:3000` because `.env.test` Neon seed fails (`Message` table missing — pre-existing env gap)

## Known Stubs

None.

## Threat Flags

None beyond plan mitigations (T-lca-01…04 applied).

## Self-Check: PASSED

- FOUND: prisma/migrations/20260722122630_add_post_type/migration.sql
- FOUND: src/shared/lib/posts/post-visibility.ts
- FOUND: 593a2d5, 6a24297, eb3057d
- FOUND: .planning/quick/260722-lca-system-news-post-type/260722-lca-SUMMARY.md
