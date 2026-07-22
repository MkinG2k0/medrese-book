---
status: complete
quick_id: 260722-kjq
completed: 2026-07-22
---

# Summary: Фото во вложениях сообщений

**Task:** Прикрепление до 5 фото к сообщениям (MessageMedia, photo-only, upload для ролей чата)

## Commits

1. `9d10772` — feat(260722-kjq): MessageMedia schema and messaging photo API
2. `a71b5db` — feat(260722-kjq): ChatPanel photo attach and bubble gallery
3. `b5a10af` — fix(260722-kjq): разрешить PDF в uploads для менеджеров
4. `9074f2f` — test(260722-kjq): e2e photo attach in messenger
5. `bdb3d5d` — docs(260722-kjq): summary and design

## What shipped

- Prisma `MessageMedia` + ADD-only migration `20260722115309_message_media`
- `sendMessageSchema`: optional body, `imageUrls` max 5, allowlist URLs, empty rejected
- `/api/uploads`: TEACHER/MANAGER/STUDENT/SUPER_ADMIN; chat roles = jpeg/png/webp; managers also video/PDF/image/*
- Messages API returns/creates `media[]`; list + notification photo previews
- ChatPanel: paperclip, draft thumbs, photo-only send, MessageMediaGrid + lightbox

## Verification

- Unit: `build-notification.test.ts` — 12 passed
- E2E: `e2e/messages.spec.ts` written; run failed locally — `.env.test` DB missing `Message` table (seed P2021), not a feature regression. Re-run after `pnpm db:migrate:deploy` against test DB.

## Follow-up

- Deploy migration `message_media` on test/prod before app deploy
- Fix/apply migrations on e2e DATABASE_URL then re-run messages e2e
