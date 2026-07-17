---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Система предметов
current_phase: 0
status: Awaiting next milestone
stopped_at: Completed 15-02-PLAN.md
last_updated: "2026-07-11T23:24:18.137Z"
last_activity: 2026-07-11
last_activity_desc: Milestone v2.0 completed and archived
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 27
  completed_plans: 27
  percent: 100
current_phase_name: student-portal-extra-assignments
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-12)

**Core value:** Учитель и менеджер видят реальный прогресс каждого ученика и могут вовремя вмешаться
**Current focus:** Planning next milestone — run `/gsd-new-milestone`

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-07-12:

| Category | Item | Status |
|----------|------|--------|
| quick_task | 260606-v2w-lessonpage-lib-fsd | unknown |
| quick_task | 260624-psw-restrict-user-switcher | unknown |
| quick_task | 260624-sk2-post-api-sessions-5 | unknown |
| quick_task | 260625-0pl-1 | unknown |
| quick_task | 260625-0wt-lesson-time-tracking | unknown |
| quick_task | 260625-1jf-teacher-lessons-analytics | unknown |
| quick_task | 260625-1q6-userstable | unknown |
| quick_task | 260625-22r-analytics-student-history-modal | unknown |
| quick_task | 260625-28w-student-status | unknown |
| quick_task | 260625-2mj-integrate-app-icon | unknown |
| quick_task | 260625-2ov-groups | unknown |
| quick_task | 260625-2sa-ui-student | unknown |
| quick_task | 260625-33a-deduplikatsiya-uchenikov | unknown |
| quick_task | 260625-krf-messenger | unknown |
| quick_task | 260625-lbe-substitution-header | unknown |
| quick_task | 260625-ljc-pwa | unknown |
| quick_task | 260625-m6v-mobile | unknown |
| quick_task | 260701-x4v-calendar-lesson-days | missing |

Note: многие quick tasks фактически выполнены (см. Quick Tasks Completed ниже); audit-open флагирует отсутствие SUMMARY.md.

## Current Position

Phase: Milestone v2.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-07-16 - Completed quick task 260716-mzj: UserSwitcher для бухгалтера

## Performance Metrics

**Velocity:**

- Total plans completed: 37
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08 | 5 | - | - |
| 9 | 5 | - | - |
| 10 | 5 | - | - |
| 12 | 5 | - | - |
| 13 | 4 | - | - |
| 11 | 6 | - | - |
| 14 | 3 | - | - |
| 15 | 4 | - | - |

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
| Phase 10-subject-foundation P05 | 35 | 3 tasks | 5 files |
| Phase 10-subject-foundation P02 | 15 | 3 tasks | 9 files |
| Phase 10-subject-foundation P03 | 20 | 3 tasks | 8 files |
| Phase 10-subject-foundation P04 | 25 | 3 tasks | 12 files |
| Phase 12-progress-sessions P02 | 12min | 3 tasks | 6 files |
| Phase 13-journal P02 | 15min | 3 tasks | 3 files |
| Phase 13-journal P04 | 25min | 3 tasks | 9 files |
| Phase 15 P01 | 8min | 3 tasks | 6 files |
| Phase 15 P02 | 12min | 3 tasks | 5 files |
| Phase 15 P03 | 15min | 3 tasks | 11 files |

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
- [Phase 10]: Migration add_subject created manually; deploy via db:migrate:deploy on target env
- [Phase 10]: DEFAULT_QURAN_SUBJECT_ID clq10defaultquransubject00 shared between migration SQL and subject-constants.ts
- [Phase 10]: subject.deleteMany after level.deleteMany due to FK Restrict
- [Phase 10]: Page imports getSubjects from actions; SubjectsList via barrel
- [Phase 10]: stepCount aggregated in page from nested level _count.steps
- [Phase 10]: Demo seed three subjects Quran Tajweed Arabic; students on Quran levels only
- [Phase 10]: DEFAULT_QURAN_SUBJECT_ID mirrored in src/shared/lib/subject-constants.ts for offsets backward compat
- [Phase 10]: Legacy /admin/program routes removed in 10-03 before subject-scoped UI in 10-04
- [Phase 10]: deleteLevel student count guard; getLevelSteps IDOR guard with subjectId
- [Phase 10]: EditLevelForm modal for Редактировать уровень (legacy /edit route never existed)
- [Phase 10]: Program editor UI at /admin/subjects/[subjectId]/program with modal level create
- [Phase 12]: recalculateStudentStepIdx accepts (studentId, groupId) and writes only to GroupEnrollment per D-01/D-08
- [Phase 12]: syncCompletionsForProgress filters adjustment sessions by groupId per SUBJ-10
- [Phase ?]: Select disabled when teacher has only one group but still visible with single option
- [Phase ?]: Active lesson guard uses teachingSession.isActive not deprecated status enum
- [Phase 13]: History group picker uses JOURNAL_HISTORY_GROUP_STORAGE_KEY independent from main journal (D-14)
- [Phase 13]: seed-e2e dual enrollment Khalid/Zayd in teacher1 second group for E2E switch
- [Phase 13]: getTeacherGroup removed from journal feature after history routes migrated
- [Phase 15]: Dashboard /student/me с карточками per GroupEnrollment и subject-scoped metrics
- [Phase 15]: student-portal groupId helpers готовы для plan 15-02
- [Phase 15]: Subject scope допзаданий через Step.level.subjectId без миграции schema
- [Phase 15]: getExtraAssignmentSubjects role-scoped — teacher только предметы своих групп
- [Phase 15]: groupId navigation — URL param > primary enrollment; localStorage при клике с карточки (D-07/D-08)
- [Quick 260716-mzj]: ACCOUNTANT — privileged actor в switch; isPrivilegedSwitchOwner без ACCOUNTANT

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
| 260702-015 | сделай в сидере 4ре главы , с разным колличеством шагов , раскидтай так же по ученикам уровни | 2026-07-01 | 0b4d679 | [260702-015-4](./quick/260702-015-4/) |
| 260702-07p | продовый сидер: только супер-админ с кодом из env | 2026-07-02 | 0eedacd | [260702-07p-prod-seeder-super-admin-from-env](./quick/260702-07p-prod-seeder-super-admin-from-env/) |
| 260702-1cl | рядом с номером шага пиши общий его номер | 2026-07-02 | de42cad | [260702-1cl-step-global-number](./quick/260702-1cl-step-global-number/) |
| 260704-1w3 | Вход замени на Пришел и добавь колонку Ушел - время выхода из системы | 2026-07-04 | c543ce8 | [260704-1w3-teacher-arrival-departure-columns](./quick/260704-1w3-teacher-arrival-departure-columns/) |
| 260704-21d | пройдись по всем ролям и по уму распредели порядок страниц, для супер админа показывай все страницы как у менеджера | 2026-07-04 | 62c8afc | [260704-21d-reorder-nav-menu-by-role](./quick/260704-21d-reorder-nav-menu-by-role/) |
| 260704-237 | добавь переименование групп | 2026-07-04 | ab6987e | [260704-237-rename-groups](./quick/260704-237-rename-groups/) |
| 260704-23a | кроме телефона опекуна сделать и имя | 2026-07-04 | 14fd227 | [260704-23a-guardian-name-field](./quick/260704-23a-guardian-name-field/) |
| 260704-2w3 | уведомления при получении сообщения | 2026-07-04 | d802689 | [260704-2w3-message-notifications](./quick/260704-2w3-message-notifications/) |
| 260704-31y | гибкие оценки в журнале: сохранение без оценки, снятие кликом, Средне = проход | 2026-07-04 | b2f95a6 | [260704-31y-journal-grade-optional](./quick/260704-31y-journal-grade-optional/) |
| 260704-34e | сделать шире (боковая панель сообщений) | 2026-07-04 | f22540c | [260704-34e-wider-messages-sidebar](./quick/260704-34e-wider-messages-sidebar/) |
| 260704-358 | улучшить отображение отпусков | 2026-07-04 | 0b17d06 | [260704-358-vacation-display](./quick/260704-358-vacation-display/) |
| 260704-3en | для менеджера и супер админу нужна история всех действий в системе по типу события и тд | 2026-07-03 | 17d55a1 | [260704-3en-audit-log-ui](./quick/260704-3en-audit-log-ui/) |
| 260705-q01 | Доп. уроки и доп. задания: справочник, назначение на уроке, оценивание | 2026-07-05 | c5cd728 | [260705-q01-extra-assignments](./quick/260705-q01-extra-assignments/) |
| 260705-t22 | добавь учителей тоже, роль отображай в badge | 2026-07-05 | 4a6365f | [260705-t22-badge](./quick/260705-t22-badge/) |
| 260705-t60 | не приходят уведомления в браузере в сообщениях | 2026-07-05 | b2464c6 | [260705-t60-browser-message-notifications-fix](./quick/260705-t60-browser-message-notifications-fix/) |
| 260705-tza | подключи s3 в проект , и создай энвы я потом их заполню | 2026-07-05 | b5ddde1 | [260705-tza-s3](./quick/260705-tza-s3/) |
| 260705-uui | система постов: новости, лайки, S3-медиа, уведомления всем | 2026-07-05 | 2a94c23 | [260705-uui-s3](./quick/260705-uui-s3/) |
| 260711-push-subscribe-fk | Fix 500 FK на POST /api/push/subscribe при устаревшей сессии | 2026-07-11 | — | [260711-push-subscribe-fk](./quick/260711-push-subscribe-fk/) |
| 260712-12i | Fix duplicate React keys in LevelStats Table (rowKey=level) | 2026-07-11 | e6fa736 | [260712-12i-fix-duplicate-react-keys-in-levelstats-t](./quick/260712-12i-fix-duplicate-react-keys-in-levelstats-t/) |
| 260712-3dh | Заметка учителя в шагах (rich-text редактор) | 2026-07-11 | b7e7339 | [260712-3dh-step-teacher-note](./quick/260712-3dh-step-teacher-note/) |
| 260712-3mf | Группа в таблице «Мои часы» и фильтр по группе | 2026-07-12 | — | [260712-3mf-hours-group-filter](./quick/260712-3mf-hours-group-filter/) |
| 260716-mop | адаптируй экран Журнал под мобилку | 2026-07-16 | f016e30 | [260716-mop-journal-mobile](./quick/260716-mop-journal-mobile/) |
| 260716-mp1 | Массовое зачисление существующих учеников в группу | 2026-07-16 | 9f7f8df | [260716-mp1-bulk-add-students-to-group](./quick/260716-mp1-bulk-add-students-to-group/) |
| 260716-mnz | Импорт книги учителя уровня 1 в teacherNote + медиа | 2026-07-16 | 2f7ce8f | [260716-mnz-1](./quick/260716-mnz-1/) |
| 260716-mzj | UserSwitcher для роли ACCOUNTANT (privileged switch) | 2026-07-16 | 6df62e6 | [260716-mzj-accountant-role-select](./quick/260716-mzj-accountant-role-select/) |
| 260716-fast | Книга учителя уровня 1 → content, не teacherNote | 2026-07-16 | b62c914 | — |
| 260718-2kp | Убрать plain-text описание для учителя из формы и журнала | 2026-07-18 | 245a869 | [260718-2kp-remove-teacher-description](./quick/260718-2kp-remove-teacher-description/) |

## Session Continuity

Last activity: 2026-07-18 - Completed quick task 260718-2kp: remove teacher description
Last session: 2026-07-17T22:54:34Z
Stopped at: Completed 260718-2kp-PLAN.md
Resume file: None

## Operator Next Steps

- Start the next milestone with `/gsd-new-milestone`
- Optional: backfill SUMMARY.md for deferred quick tasks via `/gsd-cleanup`
