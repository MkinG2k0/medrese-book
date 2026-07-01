---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 01
current_phase_name: student-analytics-history
status: verifying
stopped_at: Completed 01-05-PLAN.md
last_updated: "2026-07-01T19:55:00.000Z"
last_activity: 2026-07-01 - Completed quick task 260701-x5w: Fix substitution label display logic
progress:
  total_phases: 10
  completed_phases: 4
  total_plans: 20
  completed_plans: 20
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-24)

**Core value:** Учитель и менеджер видят реальный прогресс каждого ученика и могут вовремя вмешаться
**Current focus:** Phase 01 — student-analytics-history

## Current Position

Phase: 01 (student-analytics-history) — VERIFYING
Plan: 5 of 5
Status: Phase complete — ready for verification
Last activity: 2026-07-01 — Completed 01-05 automated tests plan

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**

- Total plans completed: 10
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08 | 5 | - | - |
| 9 | 5 | - | - |

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
| Phase 09-realtime-notifications-and-web-push-api-with-vapid-keys P05 | 90 | 3 tasks | 7 files |
| Phase 01-student-analytics-history P01 | 12 | 3 tasks | 11 files |
| Phase 01-student-analytics-history P02 | 28 | 3 tasks | 15 files |
| Phase 01-student-analytics-history P03 | 25 | 3 tasks | 11 files |
| Phase 01-student-analytics-history P04 | 30 | 3 tasks | 6 files |

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
- [Phase 09]: NOTF-03 deferred to ANLY-07 — no performance domain events in v1
- [Phase 09]: E2E notifications UI-first; DB helpers optional via isNotificationSchemaAvailable
- [Phase 01]: localStepIdx inline in period-metrics to avoid Prisma in vitest
- [Phase 01]: AtRiskStudentRow stores minutes as numbers; UI formats labels
- [Phase 01]: durationMinutes inline in shared lib (FSD, no features import)
- [Phase 01]: getAtRiskStudents N+1 per student acceptable for v1 data layer
- [Phase ?]: D-04: actualTimeSource default teaching_session after timer verification
- [Phase 01]: At-risk teacher column hidden when specific teacher filter selected
- [Phase 01]: Timer E2E on teacher2 to isolate from journal.spec.ts
- [Phase 01]: At-risk E2E falls back to TopStudents when at-risk empty

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1:** норматив 48ч закрыт в CONTEXT (D-01…D-04): сумма Step.hours пройденных шагов уровня
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
| 260625-krf | простой мессенджер: менеджер↔учителя/ученики, учитель↔менеджеры и свои ученики, ученик↔свой учитель и менеджер | 2026-06-25 | 044094d | [260625-krf-messenger](./quick/260625-krf-messenger/) |
| 260625-lbe | если учителя кто-то замещает — показывать в хедере кто и до какого; у замещающего тоже до какого | 2026-06-25 | 19198ab | [260625-lbe-substitution-header](./quick/260625-lbe-substitution-header/) |
| 260625-ljc | PWA для установки на телефон с push-уведомлениями (сообщения, отпуска) | 2026-06-25 | 1a368a5 | [260625-ljc-pwa](./quick/260625-ljc-pwa/) |
| 260625-m6v | адаптируй приложение под мобилки | 2026-06-25 | baeab63 | [260625-m6v-mobile](./quick/260625-m6v-mobile/) |
| 260701-pj3 | Скрыть будущие шаги в завершённом уроке / старых данных | 2026-07-01 | — | [260701-pj3-hide-future-steps-on-completed-lesson](./quick/260701-pj3-hide-future-steps-on-completed-lesson/) |
| 260701-ppw | Кнопка переключения роли после входа менеджера за учителя | 2026-07-01 | 36ced6b | [260701-ppw-fix-manager-teacher-switch](./quick/260701-ppw-fix-manager-teacher-switch/) |
| 260701-attendance-by-day | Посещённые занятия по дням в таблице топа учеников | 2026-07-01 | — | [260701-attendance-by-day](./quick/260701-attendance-by-day/) |
| 260701-rl0 | обнови seed: разношерстные данные, больше учеников, прогресс по месяцам | 2026-07-01 | cfae670 | [260701-rl0-seed](./quick/260701-rl0-seed/) |
| 260701-x5w | Исправить отображение метки «Замещение» — только при активном замещении | 2026-07-01 | c4d83ea | [260701-x5w-fix-substitution-label-display-logic](./quick/260701-x5w-fix-substitution-label-display-logic/) |

## Session Continuity

Last activity: 2026-07-01 - Completed quick task 260701-rl0: реалистичный seed
Last session: 2026-07-01T16:41:00.920Z
Stopped at: Completed 01-02-PLAN.md
Resume file: .planning/phases/01-student-analytics-history/01-03-PLAN.md
