# Quick Task 260705-uui: Система постов / новостей

## Цель

Менеджер публикует новости с заголовком, описанием (Tiptap), фото/видео в S3. Все роли видят ленту `/news`, могут лайкать. При публикации — уведомления всем пользователям.

## Tasks

### Task 1: Data layer + API
- Prisma: Post, PostMedia, PostLike, POST_PUBLISHED notification
- API: GET/POST /api/posts, DELETE /api/posts/[id], POST /api/posts/[id]/like
- Domain event POST_PUBLISHED → notifications + push

### Task 2: UI + navigation
- `/news` — лента для всех ролей
- `/admin/posts` — создание/удаление для менеджера
- Пункты меню в AppShell
- E2E: e2e/posts.spec.ts
