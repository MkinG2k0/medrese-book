---
phase: 260722-lca-system-news-post-type
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations
  - src/shared/lib/validations/post.ts
  - src/shared/lib/posts/post-dto.ts
  - src/shared/lib/posts/post-visibility.ts
  - src/app/api/posts/route.ts
  - src/app/api/posts/[id]/route.ts
  - src/app/api/posts/[id]/like/route.ts
  - src/shared/lib/notifications/enqueue-notifications.ts
  - src/features/posts/ui/NewsFeedPage.tsx
  - src/features/posts/ui/PostCard.tsx
  - e2e/posts.spec.ts
autonomous: true
requirements:
  - QUICK-system-news-post-type
user_setup: []

must_haves:
  truths:
    - "Менеджер при создании/редактировании выбирает тип поста: обычная или системная"
    - "Существующие посты остаются GENERAL и видны ученикам"
    - "STUDENT не получает SYSTEM в GET /api/posts и не открывает/лайкает SYSTEM по id (404)"
    - "POST_PUBLISHED для SYSTEM уведомляет только не-STUDENT (кроме автора); для GENERAL — всех кроме автора"
    - "На карточке SYSTEM отображается тег «Системная»"
  artifacts:
    - path: prisma/schema.prisma
      provides: "enum PostType GENERAL|SYSTEM + Post.type @default(GENERAL)"
    - path: src/shared/lib/posts/post-visibility.ts
      provides: "where/guard helpers for role × PostType"
    - path: src/shared/lib/validations/post.ts
      provides: "type in create/update schemas"
    - path: src/features/posts/ui/NewsFeedPage.tsx
      provides: "Radio «Тип поста» in create/edit modal"
    - path: e2e/posts.spec.ts
      provides: "SYSTEM hidden from student, visible to teacher"
  key_links:
    - from: Post.type
      to: GET /api/posts where + GET/like [id] guard
      via: "post-visibility helpers"
    - from: POST create payload.type
      to: POST_PUBLISHED recipient filter
      via: "enqueue-notifications user.findMany role filter"
    - from: PostDto.type
      to: PostCard Tag + NewsFeedPage form
      via: "toPostDto + create/update mutations"
---

<objective>
Добавить тип поста GENERAL | SYSTEM: менеджер выбирает при создании/редактировании; SYSTEM скрыт от STUDENT в API и уведомлениях; UI с Radio и бейджем «Системная» (D-01…D-06).

Purpose: Системные новости для персонала без показа ученикам, без поломки текущей ленты.

Output: миграция Post.type, API visibility + notifications, UI create/edit + Tag, e2e в posts.spec.ts.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/quick/260722-lca-system-news-post-type/260722-lca-PLAN.md
@prisma/schema.prisma
@src/shared/lib/validations/post.ts
@src/shared/lib/posts/post-dto.ts
@src/app/api/posts/route.ts
@src/app/api/posts/[id]/route.ts
@src/app/api/posts/[id]/like/route.ts
@src/shared/lib/notifications/enqueue-notifications.ts
@src/shared/lib/notifications/build-notification.ts
@src/features/posts/ui/NewsFeedPage.tsx
@src/features/posts/ui/PostCard.tsx
@e2e/posts.spec.ts
@.cursor/rules/prisma-migrations.mdc
@.cursor/rules/new-module-tests.mdc
</context>

## Scope

- Enum name: **`PostType`** (`GENERAL` | `SYSTEM`) — consistent with `PostMediaType` / `AwardType` (not PostAudience).
- Column: `Post.type PostType @default(GENERAL)` — existing rows stay visible to students (D-01, D-02).
- Migration: safe `ADD COLUMN` / `CREATE TYPE` only; no DROP/DELETE (D-06).
- Notifications: filter recipients for SYSTEM to roles ≠ STUDENT (D-03).
- UI Russian: Radio «Тип поста» (Обычная / Системная); Tag «Системная» on SYSTEM cards (D-04).
- API role filter on list + single-post GET + like (D-05).
- Out of scope: new notification types, separate news feeds, student UI for type picker.

## Source Coverage Audit

| SOURCE | ID | Item | Plan | Status |
|--------|-----|------|------|--------|
| GOAL | — | System news post type for non-students | 01 | COVERED |
| REQ | QUICK-system-news-post-type | Post types + visibility + notify + UI + e2e | 01 | COVERED |
| RESEARCH | — | (none; codebase patterns) | — | n/a |
| CONTEXT | D-01 | Post types GENERAL/SYSTEM; manager selects on create/edit | Task 1–3 | COVERED |
| CONTEXT | D-02 | GENERAL default; visible to all incl. STUDENT | Task 1–2 | COVERED |
| CONTEXT | D-03 | POST_PUBLISHED: SYSTEM → non-students only | Task 2 | COVERED |
| CONTEXT | D-04 | Radio in modal + Tag «Системная» | Task 3 | COVERED |
| CONTEXT | D-05 | Filter GET /api/posts + single-post guard | Task 2 | COVERED |
| CONTEXT | D-06 | Prisma safe ADD + Russian UI + FSD + e2e | Tasks 1–3 | COVERED |
| Deferred | — | — | — | none |

<tasks>

<task type="auto">
  <name>Task 1: PostType schema, Zod, DTO contract</name>
  <files>prisma/schema.prisma, prisma/migrations, src/shared/lib/validations/post.ts, src/shared/lib/posts/post-dto.ts, src/shared/lib/posts/post-visibility.ts</files>
  <read_first>
    - prisma/schema.prisma — model Post (~564), enum PostMediaType pattern
    - .cursor/rules/prisma-migrations.mdc — ADD COLUMN only
    - src/shared/lib/validations/post.ts — createPostSchema / updatePostSchema
    - src/shared/lib/posts/post-dto.ts — PostDto, toPostDto, postListSelect
  </read_first>
  <action>
    Per D-01/D-02/D-06: Add Prisma enum `PostType { GENERAL SYSTEM }` next to other post enums. On `Post`, add `type PostType @default(GENERAL)`. Create migration via `pnpm db:migrate -- --name add_post_type` (or `--create-only` if DATABASE_URL is remote). Verify migration SQL only adds enum/column with DEFAULT GENERAL — no destructive ops.

    Extend `createPostSchema` / `updatePostSchema` with `type: z.enum(['GENERAL', 'SYSTEM']).default('GENERAL')` so omitted type stays GENERAL.

    Add `type` to `PostDto`, `toPostDto` input/output, and `postListSelect`.

    Create `src/shared/lib/posts/post-visibility.ts` with: (1) Prisma `where` fragment that for `role === 'STUDENT'` restricts to `type: 'GENERAL'`, otherwise no type filter; (2) `assertPostVisibleToRole(type, role)` returning boolean (STUDENT + SYSTEM → false). Do not put UI strings in this helper.
  </action>
  <verify>
    <automated>pnpm exec prisma validate && pnpm exec tsc --noEmit -p tsconfig.json</automated>
  </verify>
  <done>
    Post.type exists with default GENERAL; Zod accepts GENERAL|SYSTEM; PostDto includes type; visibility helper ready for API.
  </done>
</task>

<task type="auto">
  <name>Task 2: API visibility, create/update type, SYSTEM notifications</name>
  <files>src/app/api/posts/route.ts, src/app/api/posts/[id]/route.ts, src/app/api/posts/[id]/like/route.ts, src/shared/lib/notifications/enqueue-notifications.ts</files>
  <read_first>
    - src/app/api/posts/route.ts — GET findMany, POST create + POST_PUBLISHED payload
    - src/app/api/posts/[id]/route.ts — GET/PATCH
    - src/app/api/posts/[id]/like/route.ts — like toggle
    - src/shared/lib/notifications/enqueue-notifications.ts — POST_PUBLISHED loads all users
    - src/shared/lib/posts/post-visibility.ts — helpers from Task 1
  </read_first>
  <action>
    Per D-05: In GET `/api/posts`, apply visibility where from helper using `session.user.role` so STUDENT never receives SYSTEM rows.

    In GET `/api/posts/[id]` and POST `/api/posts/[id]/like`: after loading post (select must include `type`), if not visible to role return 404 with existing Russian not-found message (same as missing post — no information leak).

    Per D-01: On POST create and PATCH update, persist `parsed.data.type`. Include `type` in domain-event payload for POST_PUBLISHED (e.g. `postType` or `type`).

    Per D-03: In `enqueue-notifications.ts` POST_PUBLISHED branch, when payload type is SYSTEM, `user.findMany` with `where: { role: { not: 'STUDENT' } }` (or `in: ['TEACHER','MANAGER','SUPER_ADMIN','ACCOUNTANT']`); when GENERAL/missing, keep current all-users query. Still exclude author via existing build-notification filter. Do not change `build-notification.ts` POST_PUBLISHED copy unless recipient list alone is insufficient.
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit -p tsconfig.json</automated>
  </verify>
  <done>
    Students cannot list/open/like SYSTEM posts; create/update store type; SYSTEM publish notifies only non-students (minus author).
  </done>
</task>

<task type="auto">
  <name>Task 3: Create/edit Radio, SYSTEM Tag, e2e</name>
  <files>src/features/posts/ui/NewsFeedPage.tsx, src/features/posts/ui/PostCard.tsx, e2e/posts.spec.ts</files>
  <read_first>
    - src/features/posts/ui/NewsFeedPage.tsx — modal state, payload, openCreate/openEdit
    - src/features/posts/ui/PostCard.tsx — title row
    - e2e/posts.spec.ts — manager create flow, student/teacher describes
    - .cursor/rules/new-module-tests.mdc — e2e in same change
    - .cursor/rules/antd-no-style-overrides.mdc — Tag without color hacks
  </read_first>
  <action>
    Per D-04: In NewsFeedPage modal add Ant Design `Radio.Group` labeled «Тип поста» with options «Обычная» (GENERAL) and «Системная» (SYSTEM). State defaults to GENERAL on create; on edit load `post.type`. Include `type` in create/update payload. Prefer Radio over Select for two options.

    On PostCard, when `post.type === 'SYSTEM'`, show antd `Tag` with text «Системная» near the title (layout via flex/gap on a div — no Flex component, no custom Tag colors).

    Per D-06 / new-module-tests: Extend `e2e/posts.spec.ts`:
    1) Manager creates SYSTEM post with unique title → sees Tag «Системная» on card.
    2) Teacher sees that SYSTEM title on `/news`.
    3) Student does not see that SYSTEM title on `/news`.
    Use dialog-scoped locators; unique titles with Date.now(); do not assert exact feed counts.
  </action>
  <verify>
    <automated>pnpm exec playwright test e2e/posts.spec.ts --reporter=line</automated>
  </verify>
  <done>
    Modal exposes тип поста; SYSTEM cards show «Системная»; e2e proves student cannot see SYSTEM while teacher/manager can.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → `/api/posts*` | Authenticated roles; STUDENT must not read SYSTEM |
| server → notification recipients | POST_PUBLISHED must not spam students for SYSTEM |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-lca-01 | Information Disclosure | GET /api/posts, GET/like [id] | high | mitigate | Role-based where + 404 guard via post-visibility (Task 2) |
| T-lca-02 | Elevation of Privilege | POST/PATCH body.type | medium | mitigate | Zod enum only; only MANAGER/SUPER_ADMIN already allowed to mutate |
| T-lca-03 | Information Disclosure | POST_PUBLISHED enqueue | medium | mitigate | Filter user query by role for SYSTEM posts (Task 2) |
| T-lca-04 | Tampering | Prisma migration | low | mitigate | ADD COLUMN DEFAULT GENERAL only; review migration.sql |
</threat_model>

<verification>
- `pnpm exec prisma validate` after schema change
- `pnpm exec tsc --noEmit -p tsconfig.json`
- `pnpm exec playwright test e2e/posts.spec.ts --reporter=line`
</verification>

<success_criteria>
- PostType GENERAL|SYSTEM with DB default GENERAL
- Manager selects type in create/edit; SYSTEM shows «Системная»
- STUDENT never lists/opens/likes SYSTEM; GENERAL unchanged for students
- SYSTEM publish notifies non-students only (except author)
- e2e covers manager create SYSTEM + teacher sees + student does not
</success_criteria>

<output>
Create `.planning/quick/260722-lca-system-news-post-type/260722-lca-SUMMARY.md` when done
</output>
