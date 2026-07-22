---
phase: 260722-kjq-messagemedia-5-photo-only-upload-teacher
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations
  - src/shared/lib/validations/message.ts
  - src/shared/lib/messaging/message-preview.ts
  - src/shared/lib/messaging/is-allowed-message-media-url.ts
  - src/shared/lib/messaging/conversation-dto.ts
  - src/shared/lib/notifications/build-notification.ts
  - src/shared/lib/notifications/build-notification.test.ts
  - src/app/api/uploads/route.ts
  - src/app/api/conversations/[id]/messages/route.ts
  - src/entities/conversation/model/types.ts
  - src/entities/conversation/api/use-messages.ts
  - src/features/messaging/ui/ChatPanel.tsx
  - src/features/messaging/ui/MessageMediaGrid.tsx
  - e2e/messages.spec.ts
  - e2e/fixtures/chat-photo.png
autonomous: true
requirements:
  - QUICK-messagemedia-photo-attachments
user_setup: []

must_haves:
  truths:
    - "Участник диалога (TEACHER/MANAGER/STUDENT) прикрепляет 1–5 jpeg/png/webp и отправляет с текстом или без (photo-only)"
    - "Пустое сообщение (нет текста и нет фото) отклоняется валидацией на клиенте и сервере"
    - "GET/POST messages возвращают media: { id, url, sortOrder }[]; POST создаёт Message + MessageMedia в одной транзакции"
    - "В списке диалогов photo-only превью — «📷 Фото» / «📷 N фото»; в уведомлении MESSAGE_RECEIVED — «Фото» / «N фото»"
    - "В пузыре чата сетка превью с lightbox по клику; Send активен при тексте или фото и без незавершённого upload"
  artifacts:
    - path: prisma/schema.prisma
      provides: "model MessageMedia + Message.media relation"
    - path: src/shared/lib/validations/message.ts
      provides: "sendMessageSchema body optional empty + imageUrls max 5 + refine"
    - path: src/app/api/uploads/route.ts
      provides: "TEACHER/MANAGER/STUDENT(+SUPER_ADMIN) + image MIME for chat roles"
    - path: src/app/api/conversations/[id]/messages/route.ts
      provides: "DTO media[] + transactional create"
    - path: src/features/messaging/ui/ChatPanel.tsx
      provides: "attach UI, draft previews, send body+imageUrls"
    - path: e2e/messages.spec.ts
      provides: "happy-path photo attach"
  key_links:
    - from: POST /api/uploads
      to: imageUrls in POST …/messages
      via: "ChatPanel upload then useSendMessage"
    - from: MessageMedia rows
      to: ChatMessage.media / ConversationSummary.lastMessage.body
      via: "toMessageDto + formatMessagePreview"
    - from: MESSAGE_RECEIVED payload
      to: notification body
      via: "imageCount / empty body → Фото preview"
---

<objective>
Добавить прикрепление до 5 фото к сообщениям мессенджера (MessageMedia, photo-only, upload для ролей чата, UI в ChatPanel) строго по design doc и CONTEXT (D-locked).

Purpose: Участники диалога обмениваются фото без обязательного текста; превью в списке и уведомлениях не пустые.

Output: миграция MessageMedia, расширенный upload/messages API, ChatPanel с превью/галереей, e2e happy path.
</objective>

<execution_context>
@$HOME/.cursor/gsd-core/workflows/execute-plan.md
@$HOME/.cursor/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/quick/260722-kjq-messagemedia-5-photo-only-upload-teacher/260722-kjq-CONTEXT.md
@docs/superpowers/specs/2026-07-22-message-photo-attachments-design.md
@prisma/schema.prisma
@src/app/api/conversations/[id]/messages/route.ts
@src/app/api/uploads/route.ts
@src/shared/lib/validations/message.ts
@src/features/messaging/ui/ChatPanel.tsx
@src/features/posts/ui/NewsFeedPage.tsx
@src/entities/conversation/api/use-messages.ts
@e2e/messages.spec.ts
</context>

## Scope

- Подход A (locked): `MessageMedia` + upload через `/api/uploads` → POST с `imageUrls`.
- Max 5 фото; photo-only (`body = ""`); пустое (нет текста и нет фото) запрещено.
- Upload roles: TEACHER, MANAGER, STUDENT (+ существующие SUPER_ADMIN/MANAGER).
- Только jpeg/png/webp для чата; видео/PDF/голос — вне скоупа.
- Превью списка: «📷 Фото» / «📷 N фото»; уведомление: «Фото» / «N фото».
- Миграция Prisma: только ADD (`CREATE TABLE MessageMedia` + FK/index), без DROP/DELETE.

## Source Coverage Audit

| Source | Item | Status |
|--------|------|--------|
| GOAL | Фото во вложениях сообщений (до 5, photo-only) | COVERED — Tasks 1–3 |
| REQ | QUICK-messagemedia-photo-attachments | COVERED — Tasks 1–3 |
| RESEARCH | (нет; design + codebase patterns) | COVERED |
| CONTEXT | MessageMedia, upload roles, MIME, preview strings, ChatPanel UI | COVERED — Tasks 1–3 |
| Deferred | — | none |
| Out of scope | Видео, PDF, голос, edit/delete вложений, client compression | excluded |

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: MessageMedia schema, validation, upload + messages API, previews</name>
  <files>prisma/schema.prisma, prisma/migrations, src/shared/lib/validations/message.ts, src/shared/lib/messaging/message-preview.ts, src/shared/lib/messaging/is-allowed-message-media-url.ts, src/shared/lib/messaging/conversation-dto.ts, src/shared/lib/notifications/build-notification.ts, src/shared/lib/notifications/build-notification.test.ts, src/app/api/uploads/route.ts, src/app/api/conversations/[id]/messages/route.ts</files>
  <read_first>
    - docs/superpowers/specs/2026-07-22-message-photo-attachments-design.md — locked contract
    - prisma/schema.prisma — Message, PostMedia analog
    - src/shared/lib/validations/message.ts — current sendMessageSchema
    - src/app/api/uploads/route.ts — SUPER_ADMIN/MANAGER only
    - src/app/api/conversations/[id]/messages/route.ts — toMessageDto, POST transaction
    - src/shared/lib/messaging/conversation-dto.ts — lastMessage body
    - src/shared/lib/notifications/build-notification.ts — MESSAGE_RECEIVED
    - src/shared/lib/notifications/build-notification.test.ts — existing message cases
    - src/shared/lib/storage/s3-config.ts — public URL prefix for allowlist
  </read_first>
  <behavior>
    - sendMessageSchema: body trim max 4000 may be empty; imageUrls string[] max 5; refine body.length &gt; 0 OR imageUrls.length &gt; 0
    - Reject imageUrls that fail isAllowedMessageMediaUrl (local `/uploads/…` or configured S3 public prefix)
    - MESSAGE_RECEIVED with empty body + imageCount 1 → notification body ends with «Фото»; imageCount N&gt;1 → «N фото»
    - Existing text MESSAGE_RECEIVED tests still pass
  </behavior>
  <action>
    1. Add `MessageMedia` model exactly as design (id, messageId, url, sortOrder, Cascade, `@@index([messageId, sortOrder])`) and `media MessageMedia[]` on `Message` (per locked design / CONTEXT).
    2. Create Prisma migration ADD-only: `pnpm db:migrate -- --name message_media`. If `DATABASE_URL` points to remote (Neon/etc.) and migrate would apply against prod-like DB, use `pnpm db:migrate -- --name message_media --create-only` then `prisma generate`. Never DROP/DELETE in SQL.
    3. New helper `formatMessagePreview({ body, mediaCount })` in `message-preview.ts`: non-empty body → body (caller may still truncate for notifications); empty body + mediaCount≥1 → list form «📷 Фото» / «📷 N фото» and notify form «Фото» / «N фото» (export both variants or a `variant: 'list' | 'notify'`).
    4. New `isAllowedMessageMediaUrl(url)`: allow paths starting with `/uploads/` OR https URLs under `getS3Config()?.publicUrl` / known bucket public base from existing s3 helpers — reject others.
    5. Update `sendMessageSchema`: `body` optional-empty (remove min(1)); add `imageUrls` default `[]` max 5; refine non-empty text or urls; each url must pass allowlist (Russian error messages).
    6. `POST /api/uploads`: `allowedRoles` include `TEACHER`, `MANAGER`, `STUDENT`, `SUPER_ADMIN`. Enforce MIME `image/jpeg|image/png|image/webp` for TEACHER/STUDENT. For MANAGER/SUPER_ADMIN keep existing post needs: same three image types plus `video/*` so NewsFeed video upload does not break. Reject other MIME with 400 Russian message; add a sane size cap (e.g. 10MB) consistent with posts intent.
    7. Messages route: include `media: { orderBy: sortOrder, select: { id, url, sortOrder } }` on GET; extend `toMessageDto` with `media` array. POST: parse `imageUrls`, create Message with `body: parsed.body` (may be `""`) and nested `media: { create: imageUrls.map((url, i) => ({ url, sortOrder: i })) }` in the same transaction; pass `imageCount: imageUrls.length` (and body) in MESSAGE_RECEIVED payload.
    8. `conversationInclude.messages.select`: also take `_count` of media or `media: { take: 1, select: { id: true } }` + count — enough for preview. In `lastMessageDto`, if body empty and mediaCount&gt;0, set `body` to list preview from `formatMessagePreview`.
    9. `build-notification` MESSAGE_RECEIVED: if trimmed body empty, use notify preview from `imageCount` in payload (default 0 → keep truncate of empty as today only if no images; with images use «Фото»/«N фото»). Extend unit tests for photo-only + multi-photo; keep text cases green.
    10. Commit: `feat(260722-kjq): MessageMedia schema and messaging photo API`
  </action>
  <verify>
    <automated>pnpm test:unit -- src/shared/lib/notifications/build-notification.test.ts</automated>
  </verify>
  <done>
    MessageMedia migrated; schema validates photo-only and rejects empty; uploads open to chat roles with image MIME; messages DTO includes media; list/notification previews use locked Russian photo strings.
  </done>
</task>

<task type="auto">
  <name>Task 2: ChatPanel attach UI, hooks, message media grid</name>
  <files>src/entities/conversation/model/types.ts, src/entities/conversation/api/use-messages.ts, src/features/messaging/ui/MessageMediaGrid.tsx, src/features/messaging/ui/ChatPanel.tsx</files>
  <read_first>
    - src/features/messaging/ui/ChatPanel.tsx — draft/send UX
    - src/entities/conversation/api/use-messages.ts — useSendMessage(body: string)
    - src/entities/conversation/model/types.ts — ChatMessage
    - src/features/posts/ui/NewsFeedPage.tsx — FormData upload to /api/uploads, beforeUpload false
    - src/features/posts/ui/PostMediaGallery.tsx — gallery idea (simplify for chat; Image preview)
  </read_first>
  <action>
    1. Extend `ChatMessage` with `media: { id: string; url: string; sortOrder: number }[]` (default empty on older payloads if needed).
    2. Change `useSendMessage` mutation input to `{ body: string; imageUrls?: string[] }` and JSON.stringify that payload (per CONTEXT approach A).
    3. Add `MessageMediaGrid` in messaging/ui: compact grid of images sorted by sortOrder; click opens antd `Image.PreviewGroup` / preview (JSX Modal/Image OK — do not use static Modal.*). Reuse PostMediaGallery idea but chat-sized, images only.
    4. ChatPanel (locked UI): paperclip/upload button (`aria-label` «Прикрепить фото»), hidden `input type=file` accept `image/jpeg,image/png,image/webp` multiple; cap total draft attachments at 5; show removable thumbnails before send; upload each file via FormData to `/api/uploads` (pattern from NewsFeedPage) collecting URLs; Send enabled when `(draft.trim() || pendingUrls.length) &amp;&amp; !uploading`; disable while upload in flight; on send call `mutateAsync({ body: draft.trim(), imageUrls })`, clear draft+attachments; on failure restore draft/attachments; render `MessageMediaGrid` inside bubble above/below text (hide empty body text node when body is empty).
    5. Russian strings only; follow antd App context / no Flex / no style-override rules already in project.
    6. Commit: `feat(260722-kjq): ChatPanel photo attach and bubble gallery`
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit -p tsconfig.json 2&gt;&amp;1 | head -n 40</automated>
  </verify>
  <done>
    Teacher/manager/student can attach up to 5 photos in ChatPanel, send photo-only or with text, see grid + lightbox in history; send blocked while uploading or when both text and photos empty.
  </done>
</task>

<task type="auto">
  <name>Task 3: E2E happy path — attach photo in chat</name>
  <files>e2e/messages.spec.ts, e2e/fixtures/chat-photo.png</files>
  <read_first>
    - e2e/messages.spec.ts — existing teacher→student flow
    - e2e/helpers/auth.ts / codes — TEST_CODES.teacher1, student
    - .cursor/rules/new-module-tests.mdc — same-PR e2e expectation
  </read_first>
  <action>
    1. Add a small valid PNG fixture at `e2e/fixtures/chat-photo.png` (1×1 or tiny real PNG bytes).
    2. Extend `e2e/messages.spec.ts` with serial test: login teacher → open messages → start/open chat with student → attach fixture via file input (`setInputFiles`) → send without requiring text (photo-only) → expect an image in the chat panel (locator `img` near bubble or role/img). Optionally assert list preview contains «Фото» after navigate/back if stable.
    3. Keep existing text-message tests green; use resilient locators (aria-label «Прикрепить фото», send button with send icon) — avoid brittle getByText substrings for names.
    4. Commit: `test(260722-kjq): e2e photo attach in messenger`
  </action>
  <verify>
    <automated>pnpm test:e2e -- e2e/messages.spec.ts</automated>
  </verify>
  <done>
    E2E covers photo-only send happy path; prior messaging e2e still pass.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client → POST /api/uploads | Authenticated user uploads binary; MIME/size must be enforced server-side |
| Client → POST …/messages | imageUrls are attacker-controlled strings; must allowlist storage URLs only |
| Participant → other participant | Only conversation members read/write messages (existing canView/userInConversation) |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kjq-01 | Spoofing | /api/uploads roles | medium | mitigate | requireRole via authorizeApiRequest; only TEACHER/MANAGER/STUDENT/SUPER_ADMIN |
| T-kjq-02 | Tampering | imageUrls in POST messages | high | mitigate | isAllowedMessageMediaUrl allowlist; max 5; transactional create |
| T-kjq-03 | Elevation | TEACHER/STUDENT upload | medium | mitigate | image MIME-only for those roles; size cap; no arbitrary file types |
| T-kjq-04 | Information | GET messages media URLs | low | accept | URLs already scoped by conversation membership checks |
| T-kjq-05 | Denial | large uploads | medium | mitigate | max file size on /api/uploads; max 5 images per message |
| T-kjq-SC | Tampering | npm installs | low | accept | no new packages in this quick task |
</threat_model>

<verification>
- Unit: build-notification photo-only cases
- tsc clean for touched client/API types
- e2e/messages.spec.ts including new photo attach
- Manual smoke (optional): attach 5 images, remove one, send photo-only, see list «📷 Фото»
</verification>

<success_criteria>
1. 1–5 photos send with or without text; empty rejected.
2. Recipient sees images + lightbox.
3. List + notification photo-only previews per locked strings.
4. TEACHER/STUDENT can upload chat images (not only manager).
5. Atomic commits per task; migration ADD-only.
</success_criteria>

<output>
Create `.planning/quick/260722-kjq-messagemedia-5-photo-only-upload-teacher/260722-kjq-SUMMARY.md` when done
</output>
