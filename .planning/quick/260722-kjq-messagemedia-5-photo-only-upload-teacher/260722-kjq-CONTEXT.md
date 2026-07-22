# Quick Task 260722-kjq: Фото во вложениях сообщений - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Task Boundary

Прикрепление до 5 фото к сообщению в мессенджере. Текст опционален (photo-only ок). Пустое сообщение запрещено.

Спека: `docs/superpowers/specs/2026-07-22-message-photo-attachments-design.md`
</domain>

<decisions>
## Locked Decisions

- Подход A: таблица `MessageMedia` + upload через `/api/uploads`, затем POST с `imageUrls`
- Максимум 5 фото на сообщение
- Photo-only разрешён (`body` = `""`)
- Роли upload: TEACHER, MANAGER, STUDENT (+ существующие SUPER_ADMIN/MANAGER)
- Только изображения (jpeg/png/webp)
- Превью в списке диалогов и уведомлениях: «📷 Фото» / «Фото»
- UI: кнопка в ChatPanel, превью до отправки, сетка в пузыре, lightbox по клику
- Вне скоупа: видео, PDF, голос, редактирование вложений
</decisions>
