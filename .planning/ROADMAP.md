# Roadmap: Электронный дневник медресе

## Overview

Brownfield-развитие журнала медресе: сначала техническая база (фильтры аналитики, API auth, student-progress, domain-events), затем аналитика и история ученика, операционное управление (карточка, задания, замещения, отпуска), безопасность сессий, уведомления и observability (аудит, аналитика преподавателя, чат). Каждая фаза — законченная проверяемая способность для пользователей.

## Phases

**Phase Numbering:**
- Phase 0: обязательный технический пролог перед пользовательскими фичами
- Phases 1–9: последовательная поставка по утверждённому бэклогу

- [ ] **Phase 0: Foundation** — фильтры аналитики, API auth, student-progress, domain-events
- [ ] **Phase 1: Student Analytics & History** — таймер урока, метрики, история, норматив 48ч
- [ ] **Phase 2: Student Management** — карточка ученика, статусы, смена преподавателя и уровня
- [ ] **Phase 3: Additional Assignments** — справочник и назначение дополнительных заданий
- [ ] **Phase 4: Substitution & Leave** — замещение преподавателей, отпуска и отгулы
- [ ] **Phase 5: Session Security** — автовыход и логирование входов/выходов
- [ ] **Phase 6: Notifications** — колокольчик и событийные уведомления
- [ ] **Phase 7: Audit, Teacher Analytics & Chat** — журнал аудита, аналитика преподавателя, чат
- [ ] **Phase 8: Leave Requests** — отпуска, отгулы, больничные: заявки, календарь, согласование, замещение
- [ ] **Phase 9: Realtime & Web Push** — realtime-доставка уведомлений, Web Push API с VAPID

## Phase Details

### Phase 0: Foundation
**Goal**: Техническая база готова — аналитика не искажена, API защищён, прогресс централизован, события расходятся в audit/notifications
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04
**Success Criteria** (what must be TRUE):
  1. Метрики аналитики не учитывают сессии-корректировки и шаги «зачтено ранее» — одинаково во всех отчётах
  2. Неавторизованный или непривилегированный запрос к API не возвращает чужие данные (default-deny)
  3. Смена уровня или шага ученика даёт согласованный прогресс в журнале, портале и аналитике
  4. Критические доменные мутации автоматически порождают записи аудита через единый механизм событий
**Plans**: 5 plans

Plans:
- [x] 00-01-PLAN.md — Wave 0: vitest + E2E test scaffolding (RED)
- [x] 00-02-PLAN.md — FND-01: Prisma flags, backfill, analytics-queries
- [x] 00-03-PLAN.md — FND-02: authorizeApiRequest + middleware + API refactor
- [x] 00-04-PLAN.md — FND-03: student-progress module + atomic mutations
- [x] 00-05-PLAN.md — FND-04: dispatchDomainEvent + AuditEvent

### Phase 1: Student Analytics & History
**Goal**: Учитель, менеджер и ученик видят реальный прогресс обучения — время, шаги, историю и предупреждения о нормативах
**Depends on**: Phase 0
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-08, ANLY-09, ANLY-10
**Success Criteria** (what must be TRUE):
  1. Преподаватель запускает и завершает урок вручную; длительность сохраняется и видна в журнале (таймер elapsed)
  2. Ученик, учитель и менеджер видят за период: число уроков, число шагов, общее время обучения
  3. Отображается прогресс по уровням и шагам программы; шаги «зачтено ранее» не входят в статистику
  4. При превышении норматива 48 часов на 1-м уровне показывается предупреждение
  5. История ученика — хронологическая лента занятий, оценок, шагов и времени по каждому занятию
**Plans**: TBD
**UI hint**: yes

### Phase 2: Student Management
**Goal**: Менеджер полноценно управляет жизненным циклом ученика через карточку и статусы
**Depends on**: Phase 1
**Requirements**: STUD-01, STUD-02, STUD-03, STUD-04, STUD-05, STUD-06, STUD-07
**Success Criteria** (what must be TRUE):
  1. Менеджер создаёт ученика с ФИО, телефонами, уровнем, шагом и преподавателем
  2. Карточка ученика показывает данные, контакты опекуна, текущего преподавателя, историю обучения, успеваемость и допзадания
  3. Менеджер меняет преподавателя или уровень с обязательной причиной; изменения фиксируются в истории
  4. Менеджер переводит ученика между статусами (активный, пауза, завершил, архив) с обязательной причиной
**Plans**: TBD

### Phase 3: Additional Assignments
**Goal**: Учитель и менеджер назначают дополнительные задания, привязанные к шагам программы
**Depends on**: Phase 2
**Requirements**: ASGN-01, ASGN-02, ASGN-03, ASGN-04, ASGN-05, ASGN-06, ASGN-07
**Success Criteria** (what must be TRUE):
  1. Справочник содержит фиксированные и пользовательские задания; виден автор каждого задания
  2. При средней оценке ниже порога учитель видит кнопку «Назначить дополнительное задание» и выбирает несколько заданий для текущего шага
  3. Учитель или менеджер может создать собственное задание в справочнике
  4. Страница всех заданий с фильтрацией по шагам и уровням; назначенные задания отображаются в истории ученика
**Plans**: TBD

### Phase 4: Substitution & Leave
**Goal**: Менеджер управляет замещениями и отпусками; замещающий получает ограниченный доступ; чужой вход без замещения запрещён
**Depends on**: Phase 2
**Requirements**: TCHR-01, TCHR-02, TCHR-03, TCHR-04, TCHR-05, LEAV-01, LEAV-02, LEAV-03, LEAV-04
**Success Criteria** (what must be TRUE):
  1. Преподаватель не может войти под чужой учёткой без официального замещения
  2. Менеджер видит коды преподавателей, назначает замещающего со сроком; замещающий работает с учениками замещаемого в этот период
  3. Ведётся история замещений
  4. Календарь отпусков и отгулов: преподаватель подаёт заявку, менеджер согласовывает или отклоняет с причиной
  5. При одобренном отпуске автоматически активируется назначенное замещение
**Plans**: TBD

### Phase 5: Session Security
**Goal**: Сессии защищены от злоупотреблений и простоя; входы и выходы отслеживаются
**Depends on**: Phase 0
**Requirements**: SECU-01, SECU-02
**Success Criteria** (what must be TRUE):
  1. После 1 часа бездействия пользователь автоматически выходит из системы
  2. Каждый вход и выход пользователя фиксируется в системе и доступен для просмотра администратором
**Plans**: TBD

### Phase 6: Notifications
**Goal**: Пользователи получают своевременные in-app уведомления о событиях обучения и операций
**Depends on**: Phase 0, Phase 1, Phase 4
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04
**Success Criteria** (what must be TRUE):
  1. В шапке приложения колокольчик показывает количество непрочитанных уведомлений
  2. Пользователь видит список непрочитанных событий и может отметить прочитанными
  3. Приходят уведомления об успеваемости (норматив 48ч, низкая оценка) и системные (отпуск, замещение)
**Plans**: TBD

### Phase 7: Audit, Teacher Analytics & Chat
**Goal**: Менеджер контролирует действия в системе, видит дисциплину преподавателей и общается через чат
**Depends on**: Phase 0, Phase 5, Phase 6
**Requirements**: AUDT-01, AUDT-02, AUDT-03, AUDT-04, TANL-01, TANL-02, TANL-03, TANL-04, CHAT-01, CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. Журнал аудита показывает кто, когда и что изменил; фильтрация по дате, пользователю, ученику, преподавателю и типу события
  2. В аудите доступна полная история ученика и преподавателя (создание, смены, занятия, замещения, отпуска)
  3. Для преподавателя отображается время входа, время начала урока, разница между ними и статистика проведённых уроков
  4. Пользователи (кроме супер-админа) ведут личные диалоги с историей сообщений; менеджер видит все чаты и раздел «Мои чаты»
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundation | 0/5 | Not started | - |
| 1. Student Analytics & History | 0/TBD | Not started | - |
| 2. Student Management | 0/TBD | Not started | - |
| 3. Additional Assignments | 0/TBD | Not started | - |
| 4. Substitution & Leave | 0/TBD | Not started | - |
| 5. Session Security | 0/TBD | Not started | - |
| 6. Notifications | 0/TBD | Not started | - |
| 7. Audit, Teacher Analytics & Chat | 0/TBD | Not started | - |
| 8. Leave Requests | 0/5 | Planned | - |
| 9. Realtime & Web Push | 0/5 | Planned | - |

### Phase 8: Leave Requests — отпуска, отгулы и больничные
**Goal**: Преподаватель подаёт заявку на отсутствие через календарь; менеджер согласовывает в календаре и гриде; при одобрении назначается замещающий; переключение учётки преподавателя — только через активное замещение
**Depends on**: Phase 2, Phase 4, Phase 6
**Requirements**: LEAV-01, LEAV-02, LEAV-03, LEAV-04, TCHR-01, TCHR-03, TCHR-04, TCHR-05 (+ новые LEAV-05… при планировании: больничный, календарь учителя)
**Success Criteria** (what must be TRUE):
  1. Преподаватель на странице «Календарь» создаёт отпуск или отгул через модалку (диапазон дат + описание); заявка получает статус «Создана»
  2. Менеджер видит новую заявку в in-app уведомлениях (Phase 6) и на календаре всех отпусков: «Создана» — серым, «Подтверждена» — зелёным; отклонённые не показываются
  3. Грид заявок под календарём: менеджер принимает или отклоняет; при отклонении — обязательная причина
  4. При принятии менеджер выбирает замещающего преподавателя на период отсутствия; замещение активируется автоматически
  5. Замещающий получает уведомление и может войти в учётку замещаемого через «Сменить учётку»; без активного замещения преподаватели не переключают чужие учётки
**Context**: `.planning/phases/08-leave-requests/08-CONTEXT.md`
**Plans**: 5 plans

Plans:
- [x] 08-01-PLAN.md — Prisma LeaveRequest/Substitution, validations, domain events, migration
- [x] 08-02-PLAN.md — Server actions, API, substitution auth (TCHR-01/03/04)
- [x] 08-03-PLAN.md — Teacher calendar UI (/calendar, LEAV-02/05)
- [x] 08-04-PLAN.md — Manager calendar + grid, approve/reject (checkpoint)
- [x] 08-05-PLAN.md — E2E leave-requests.spec.ts + domain events smoke

### Phase 9: Realtime notifications and Web Push API with VAPID keys
**Goal**: Пользователи получают уведомления в реальном времени и через Web Push; колокольчик работает для всех ролей
**Depends on**: Phase 6, Phase 8
**Requirements**: NOTF-01, NOTF-02, NOTF-04, NOTF-05 (realtime SSE), NOTF-06 (web push); NOTF-03 отложен
**Success Criteria** (what must be TRUE):
  1. Новое in-app уведомление появляется без перезагрузки страницы (realtime-канал)
  2. Пользователь может подписаться на Web Push; push приходит при ключевых событиях (заявка, решение, замещение)
  3. VAPID-ключи настроены через env; service worker регистрируется корректно
  4. Колокольчик и счётчик непрочитанных доступны всем ролям
**Context**: `.planning/phases/09-realtime-notifications-and-web-push-api-with-vapid-keys/09-CONTEXT.md`
**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — Prisma Notification/PushSubscription, enqueue, dispatch return, migration
- [x] 09-02-PLAN.md — REST API, React Query hooks, NotificationBell в AppShell (NOTF-01/02/04)
- [x] 09-03-PLAN.md — SSE stream, useNotificationStream, middleware sw.js, E2E realtime
- [x] 09-04-PLAN.md — web-push, VAPID, sw.js, subscribe API, deliverNotifications push
- [x] 09-05-PLAN.md — E2E notifications.spec.ts, send-push unit tests, NOTF-03 deferral

---
*Roadmap created: 2026-06-24*
*Updated: 2026-06-25 — Phases 8–9 added*
*Granularity: extended (10 phases)*
