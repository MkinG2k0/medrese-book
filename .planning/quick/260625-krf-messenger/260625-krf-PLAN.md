# Quick Task 260625-krf: Простой мессенджер

## Цель

Личные диалоги с правилами доступа:
- **Менеджер** ↔ учителя и ученики
- **Учитель** ↔ менеджеры и только свои ученики (группа)
- **Ученик** ↔ свой учитель и менеджер
- **Супер-админ** — вне чата

Асинхронная модель (polling), без WebSocket.

## Tasks

### Task 1: Schema + access control

**files:** prisma/schema.prisma, migration, `src/shared/lib/messaging/can-message-user.ts`, validations
**action:** Conversation (participant1/2), Message; helper проверки доступа
**verify:** prisma migrate
**done:** модели в БД

### Task 2: API routes

**files:** `/api/messaging/contacts`, `/api/conversations`, `/api/conversations/[id]/messages`
**action:** список контактов, диалоги, отправка/чтение сообщений
**verify:** API с auth
**done:** REST готов

### Task 3: UI + navigation

**files:** entities/conversation, features/messaging, `/messages` page, AppShell
**action:** список диалогов + панель чата, polling 5s
**verify:** manual
**done:** UI работает

### Task 4: E2E

**files:** e2e/messages.spec.ts
**action:** teacher↔student, student↔manager, role access
**verify:** pnpm test:e2e messages
**done:** тесты проходят
