---
status: complete
---

# Quick Task 260705-uui — Summary

## Done

- **Prisma:** `Post`, `PostMedia`, `PostLike`; `NotificationType.POST_PUBLISHED`
- **API:** CRUD постов (создание/удаление — менеджер), лайк для всех ролей
- **Уведомления:** domain event `POST_PUBLISHED` → in-app + Web Push всем (кроме автора)
- **UI:** `/news` (лента), `/admin/posts` (создание с Tiptap + загрузка фото/видео через S3)
- **Меню:** «Новости» для всех ролей; «Новости (админ)» для менеджера
- **E2E:** `e2e/posts.spec.ts`

## Commit

2a94c23 — feat(posts): система новостей с лайками и уведомлениями

## Примечания

- Медиа загружаются через `/api/uploads` (S3 при настроенных env, иначе `public/uploads`)
- Комментарии не реализованы (по требованию)
- SUPER_ADMIN имеет те же права на публикацию, что и MANAGER
