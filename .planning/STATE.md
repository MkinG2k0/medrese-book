---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 09-04-PLAN.md
last_updated: "2026-06-25T07:35:17.004Z"
last_activity: 2026-06-25
progress:
  total_phases: 10
  completed_phases: 2
  total_plans: 15
  completed_plans: 14
  percent: 93
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-24)

**Core value:** Учитель и менеджер видят реальный прогресс каждого ученика и могут вовремя вмешаться
**Current focus:** Phase 09 — realtime-notifications-and-web-push-api-with-vapid-keys

## Current Position

Phase: 09 (realtime-notifications-and-web-push-api-with-vapid-keys) — EXECUTING
Plan: 5 of 5
Status: Ready to execute
Last activity: 2026-06-25

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 00-foundation P01 | 12 | 3 tasks | 9 files |
| Phase 00-foundation P02 | 35 | 3 tasks | 8 files |
| Phase 00-foundation P03 | 50 | 3 tasks | 8 files |
| Phase 08-leave-requests P01 | 25 | 3 tasks | 8 files |
| Phase 08-leave-requests P02 | 35 | 3 tasks | 13 files |
| Phase 08-leave-requests P03 | 30 | 3 tasks | 7 files |
| Phase 08-leave-requests P04 | 45 | 4 tasks | 16 files |
| Phase 09-realtime-notifications-and-web-push-api-with-vapid-keys P01 | 25 | 3 tasks | 9 files |
| Phase 09-realtime-notifications-and-web-push-api-with-vapid-keys P02 | 15 | 3 tasks | 13 files |
| Phase 09-realtime-notifications-and-web-push-api-with-vapid-keys P03 | 45 | 3 tasks | 7 files |
| Phase 09-realtime-notifications-and-web-push-api-with-vapid-keys P04 | 25 | 3 tasks | 14 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Phase 0 (foundation) обязателен до пользовательских фич
- Roadmap: аналитика ученика (Phase 1) — ядро ценности; чат в Phase 7
- Roadmap: security (idle timeout) отделён от substitution auth (Phase 4 vs 5)
- [Phase 00-foundation]: e2e db helper uses pg Pool not Prisma to avoid Playwright ESM errors
- [Phase 00-foundation]: findFirst for adjustment session uses isAdjustment:true filter
- [Phase 00-foundation]: Neon drift resolved via migrate resolve before foundation_analytics_flags deploy
- [Phase 00-foundation]: API 401 JSON in auth.config authorized callback; matcher already covers /api/*
- [Phase 00-foundation]: GET /api/sessions studentId scope before date branch closes CONCERNS leak
- [Phase 08]: LeaveRequest↔Substitution: FK substitutionId на LeaveRequest; leaveRequestId скаляр
- [Phase 08]: Drift add_student_status resolved via migrate resolve before leave migration
- [Phase 08]: LeaveRequestListItem в entities для FSD compliance
- [Phase 08]: substitution-access в shared/lib для auth без импорта features
- [Phase 08]: Client zod schema для CreateLeaveModal отдельно от server schema (Dayjs RangePicker)
- [Phase 08]: REJECTED заявки скрыты на календаре учителя, видны только в detail modal
- [Phase 08]: Post-checkpoint: teacher grid shows all statuses; edit/resubmit CREATED/REJECTED; substitution label in header/switcher
- [Phase 08]: LeaveCalendar mode manager — REJECTED hidden on calendar, visible in grid filter
- [Phase 09]: Notification copy and type labels in shared/lib without feature imports
- [Phase 09]: dispatchDomainEvent returns Notification[] for post-commit deliverNotifications
- [Phase 09]: NotificationBell без RoleGuard для всех dashboard-ролей
- [Phase 09]: useUnreadCount refetchInterval 60s до SSE в 09-03
- [Phase 09]: SSE userId только из session; EventSource reconnect max 3
- [Phase 09]: middleware исключает sw.js перед Web Push фазой
- [Phase 09]: Web Push VAPID public key через NEXT_PUBLIC или GET /api/push/vapid-public
- [Phase 09]: PushSubscribePrompt opt-in в footer dropdown колокольчика
- [Phase 09]: deliverNotifications fire-and-forget sendPushToUser; 410 удаляет stale PushSubscription

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1:** уточнить норматив 48ч — по часам программы (`Step.hours`) или по фактическому времени таймера
- **Phase 4:** правила auto-substitute при одобрении отпуска — менеджер выбирает vs автоматический matching
- **Phase 8:** больничный — отдельный тип или подтип отгула; границы с Phase 4
- **Phase 0:** middleware для `/api/*` vs per-route `authorizeApiRequest` — решить при планировании

### Roadmap Evolution

- Phase 8 added: отпуска, отгулы и больничные — заявки преподавателя, согласование менеджером, замещение
- Phase 9 added: realtime-уведомления и Web Push API с VAPID-ключами (отдельно от in-app Phase 6)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260624-psw | Убрать переключение ролей кроме менеджера/админа, исключить учеников | 2026-06-24 | ee3858c | [260624-psw-restrict-user-switcher](./quick/260624-psw-restrict-user-switcher/) |
| 260624-sk2 | Оптимизировать POST /api/sessions (5 сек) | 2026-06-24 | 24142ec | [260624-sk2-post-api-sessions-5](./quick/260624-sk2-post-api-sessions-5/) |
| 260625-0pl | разлогинить ТОЛЬКО преподавателя при неактивности в 1 час | 2026-06-24 | 15396b1 | [260625-0pl-1](./quick/260625-0pl-1/) |
| 260625-0wt | Трекинг времени уроков: вход, начать/закончить урок, блокировка таблицы, авто-stop при logout | 2026-06-24 | 125e978 | [260625-0wt-lesson-time-tracking](./quick/260625-0wt-lesson-time-tracking/) |
| 260625-1jf | Аналитика учителей: грид уроков, вход/старт/конец/длительность, день или диапазон | 2026-06-24 | f12a9a6 | [260625-1jf-teacher-lessons-analytics](./quick/260625-1jf-teacher-lessons-analytics/) |
| 260625-1q6 | Страница группы — список учеников через UsersTable | 2026-06-24 | 7efadcd | [260625-1q6-userstable](./quick/260625-1q6-userstable/) |
| 260625-22r | Модалка истории учёбы по клику на ученика в аналитике | 2026-06-24 | 732781a | [260625-22r-analytics-student-history-modal](./quick/260625-22r-analytics-student-history-modal/) |
| 260625-28w | Статусы учеников: активен / пауза / архив | 2026-06-25 | c9e78cd | [260625-28w-student-status](./quick/260625-28w-student-status/) |
| 260625-2mj | интегрируй иконку в приложение | 2026-06-24 | e79075f | [260625-2mj-integrate-app-icon](./quick/260625-2mj-integrate-app-icon/) |
| 260625-2ov | добавь кнопку создать группу в /groups | 2026-06-24 | c3ed60c | [260625-2ov-groups](./quick/260625-2ov-groups/) |
| 260625-2sa | улучшить UI ученика: уроки на отдельной странице, скрыть смену учётки | 2026-06-24 | 0e67df9 | [260625-2sa-ui-student](./quick/260625-2sa-ui-student/) |
| 260625-33a | дублирование данных и ученики в «Сменить учётку» | 2026-06-24 | bfd031f | [260625-33a-deduplikatsiya-uchenikov](./quick/260625-33a-deduplikatsiya-uchenikov/) |

## Session Continuity

Last activity: 2026-06-24 - Completed quick task 260625-33a: дублирование данных и ученики в «Сменить учётку»
Last session: 2026-06-25T07:35:17.002Z
Stopped at: Completed 09-04-PLAN.md
Resume file: None
