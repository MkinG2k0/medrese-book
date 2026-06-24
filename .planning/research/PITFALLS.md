# Domain Pitfalls

**Domain:** Brownfield LMS — журнал медресе с расширениями аналитики, таймеров, заданий, замещений и аудита  
**Researched:** 2026-06-24  
**Context:** Next.js 16 + Prisma 7 + PostgreSQL; известный техдолг — API auth gaps, глобальный `currentStepIdx`, синтетические сессии, `deleteMany` при сохранении completions

## Critical Pitfalls

Ошибки, ведущие к переписыванию модулей, искажённой отчётности или утечкам данных.

### Pitfall 1: Аналитика поверх «грязных» сессий без фильтрации источника

**What goes wrong:** Метрики «уроков пройдено», «время обучения», «топ учеников» включают синтетические сессии из `syncCompletionsForProgress()` (note «Корректировка прогресса»), дубли `StepCompletion` и сессии без реального урока. Менеджер видит завышенный прогресс; норматив 48 часов срабатывает ложно или не срабатывает.

**Why it happens:** Существующая модель `Session` — единственный контейнер и для журнала, и для админ-корректировок. Новые запросы аналитики наследуют `include: { sessions, completions }` без `WHERE` по типу события.

**Consequences:** Недоверие к дашбордам; споры с родителями/учителями; невозможность отделить «реальное обучение» от «зачтено ранее» (требование PROJECT.md).

**Prevention:**
- Ввести явный признак сессии: `sessionType` (`LESSON` | `ADJUSTMENT` | `SUBSTITUTE`) или отдельная таблица `ProgressAdjustment` без привязки к журналу.
- Все аналитические запросы — через единый слой `analytics-queries.ts` с обязательным фильтром `sessionType = LESSON`.
- Шаги «зачтено ранее» помечать на уровне `StepCompletion` (`source: ADMIN_CREDIT | LESSON | ASSIGNMENT`), не выводить в счётчики пройденных уроков.

**Detection:** Расхождение «кол-во сессий в журнале учителя» vs «кол-во в истории ученика»; ученики с completions без ни одной сессии `LESSON` за период.

**Confidence:** HIGH — подтверждено кодом `sync-completions-for-progress.ts` и CONCERNS.md.

---

### Pitfall 2: Смешение трёх разных понятий «времени»

**What goes wrong:** В одном поле или одном виджете смешиваются: (1) норматив часов программы (`Step.hours`, кумулятив в `lesson-hours.ts`), (2) фактическая длительность урока (таймер), (3) опоздание (`lateMinutes`). Текущая `getLevelStats()` уже считает `totalHours` как `sum(step.hours) - lateHours` — это не время обучения.

**Why it happens:** Продуктовые требования говорят «48 часов на 1-й уровень» и «общее время обучения» — разные метрики, но в схеме нет отдельных полей.

**Consequences:** Норматив 48ч считается по программе, а пользователь думает, что по таймеру; предупреждения не срабатывают или срабатывают на каждого.

**Prevention:**
- Три явных метрики в UI и API: `curriculumHours` (по шагам), `actualLessonMinutes` (сумма таймеров), `normativeDeadline` (48ч для level 1 — уточнить: по программе или по факту).
- В Prisma: `Session.startedAt`, `Session.endedAt`, `Session.durationMinutes` (вычисляемое или материализованное).
- Не переиспользовать `Step.hours` для таймера урока.

**Detection:** Юнит-тесты на расчёт норматива с mock-сессиями разных типов; сравнение «часы в аналитике» vs «сумма durationMinutes».

**Confidence:** HIGH — подтверждено `analytics.ts` и PROJECT.md.

---

### Pitfall 3: Таймер урока только на клиенте (Zustand / `Date.now()`)

**What goes wrong:** Таймер живёт в `journal-store` или localStorage; при закрытии вкладки, смене устройства, auto-logout (1ч бездействия — фаза 2) время теряется или дублируется. Учитель «забыл нажать Завершить» — урок висит бесконечно.

**Why it happens:** Быстрый UX-путь — считать секунды в React; journal уже смешивает Zustand + React Query.

**Consequences:** Аналитика времени бессмысленна; споры «сколько длился урок»; накопление незакрытых сессий в БД.

**Prevention:**
- Сервер — источник истины: `POST /api/sessions/start`, `POST .../end` с `startedAt`/`endedAt` в UTC.
- Клиент показывает countdown через offset к серверному времени (`performance.now()` + server timestamp в ответе API).
- Фоновая задача: auto-close уроков старше N часов с флагом `autoClosed: true`.
- Идемпотентность: один активный урок на `(studentId, calendarDay)`.

**Detection:** E2E: старт → перезагрузка страницы → таймер продолжается; два таба → нет двух активных таймеров.

**Confidence:** HIGH — industry pattern (server-side timestamps for audit); LOW на auto-close policy — нужно уточнение у заказчика.

---

### Pitfall 4: Новые API для истории/аналитики без закрытия auth gap

**What goes wrong:** Эндпоинты `GET /api/sessions?studentId=` без `date` уже отдают 30 сессий любому аутентифицированному пользователю. Добавление `/api/student-history`, `/api/assignments`, `/api/audit-log` по тому же шаблону — мгновенная утечка PII.

**Why it happens:** `middleware.ts` исключает весь `/api/*` кроме `/api/auth`; проверки ad hoc в каждом handler.

**Consequences:** Ученик читает чужую историю; замещающий учитель видит лишние группы; регуляторный и репутационный риск.

**Prevention:**
- **До** фазы 1: общий `authorizeApiAccess(actor, resource, action)` + матрица ролей.
- Default-deny wrapper для route group `/api/*`.
- Интеграционные тесты на каждый новый endpoint (STUDENT cross-group, TEACHER not owner, SUBSTITUTE scoped).
- История ученика: server actions с теми же правилами, что UI — не «только API».

**Detection:** Тест: `STUDENT` token + чужой `studentId` → 403; отсутствие тестов = красный флаг.

**Confidence:** HIGH — подтверждено `sessions/route.ts` GET и CONCERNS.md (Known Bugs).

---

### Pitfall 5: Замещение преподавателя как «переключение пользователя» без контекста

**What goes wrong:** Реализация замещения через существующий `switchUser()` (подмена JWT на код другого учителя) без записи `SubstitutionPeriod`, без ограничения по группам/срокам. В dev `canSwitchUser()` разрешает всем ролям.

**Why it happens:** Переиспользование готового impersonation вместо отдельной модели «действую от имени X в рамках замещения Y».

**Consequences:** Учитель A работает в журнале группы B после окончания замещения; аудит показывает «учитель B вёл урок», хотя это был A; невозможно доказать, кто реально вёл занятие.

**Prevention:**
- Модель `TeacherSubstitution`: `substituteTeacherId`, `absentTeacherId`, `groupIds[]`, `startsAt`, `endsAt`, `reason`, `approvedBy`.
- Сессия JWT дополняется claim `actingAsTeacherId` + `substitutionId` (не полный switch user).
- Журнал и API проверяют: `teacherId === group.teacherId OR activeSubstitution(substitute, group)`.
- Запрет входа под чужой учёткой (фаза 2) = отключить произвольный switch для TEACHER в prod.

**Detection:** Урок сохранён после `endsAt` замещения; audit log без связи substitution ↔ session.

**Confidence:** HIGH для риска impersonation — CONCERNS.md; MEDIUM для точной JWT-модели — требует phase research.

---

### Pitfall 6: Аудит-лог как afterthought (UPDATE вместо append-only)

**What goes wrong:** «Журнал аудита» реализуют как `updatedAt` на существующих таблицах или перезапись записей. При споре нельзя восстановить «кто выставил оценку 3, потом 5».

**Why it happens:** `POST /api/sessions` уже делает `completions: { deleteMany: {}, create: [...] }` — культура «текущее состояние», не «история событий».

**Consequences:** Аудит не выдерживает проверку менеджером; дублирование shadow-отчётов в Excel (типичный LMS anti-pattern).

**Prevention:**
- Таблица `AuditEvent`: append-only, без UPDATE/DELETE (или soft-delete только для GDPR).
- Поля: `actorUserId`, `actorRole`, `impersonation/substitutionId`, `entityType`, `entityId`, `action`, `payload` (JSON diff), `createdAt`, `ip` (опционально).
- Критические мутации (оценка, прогресс, смена преподавателя, код входа) — только через сервис, пишущий audit в той же транзакции.
- UI фильтрации — read replica или индексы по `(entityType, createdAt)`, `(studentId)`, `(teacherId)`.

**Detection:** В audit нет события при изменении оценки; нельзя ответить «состояние на дату X».

**Confidence:** HIGH — LMS compliance literature + CONCERNS.md (Missing audit trail).

---

### Pitfall 7: Глобальный `currentStepIdx` ломает историю и задания

**What goes wrong:** Допзадание привязывают к «текущему шагу» через глобальный offset; при смене уровня, `recalculateStudentStepIdx`, reorder шагов программы — задания «переезжают» на другой шаг. История показывает шаг по сегодняшнему индексу, а не по состоянию на дату урока.

**Why it happens:** `currentStepIdx` — сквозной индекс через все уровни (`getStepOffsetForLevel`); логика размазана по 8+ файлам.

**Consequences:** Неверная привязка заданий; история ученика неконсистентна после правки программы.

**Prevention:**
- Задания и completions хранят `stepId` (UUID), не локальный индекс.
- История — snapshot: `stepId`, `stepTitle`, `levelNumber` на момент события (денормализация или join с версией программы).
- Централизовать progress service до фазы 2; тесты на границе уровней.

**Detection:** Изменить order шага в админке → старая история «прыгает»; integration tests fail на level transition.

**Confidence:** HIGH — CONCERNS.md + schema (`Step.order`, `Student.currentStepIdx`).

---

### Pitfall 8: Дополнительные задания без жизненного цикла и связи с прогрессом

**What goes wrong:** Справочник заданий + boolean «выполнено» без статусов (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), без автора назначения, без срока. Задания дублируют шаги программы или не попадают в историю ученика.

**Why it happens:** Давление «быстро дать учителю список заданий» без модели назначения.

**Consequences:** Аналитика заданий (фаза 3+, отложено) невозможна; путаница с `StepCompletion`.

**Prevention:**
- `AssignmentTemplate` (каталог) + `Assignment` (экземпляр на ученика): `studentId`, `assignedBy`, `dueAt`, `status`, `completedAt`, опционально `stepId`.
- Не создавать `StepCompletion` для допзаданий, если они не равны шагам программы.
- Карточка ученика агрегирует из одного query-service, не copy-paste из journal.

**Detection:** Задание выполнено, но нет в истории; два источника правды для «что ученик делал».

**Confidence:** MEDIUM — domain pattern; детали статусов — phase 2 research.

---

## Moderate Pitfalls

### Pitfall 9: Расширение аналитики без SQL-агрегации и индексов

**What goes wrong:** `getTopStudents()` / новая история загружают всех учеников с nested `completions` + `sessions` в память. При 500+ учениках и таймерах — таймауты Vercel/Neon.

**Why it happens:** Паттерн уже в `analytics.ts`; Prisma schema без `@@index` на `studentId`, `sessionId`, `date`, `createdAt`.

**Prevention:** `GROUP BY` / raw SQL для агрегатов; индексы в миграции фазы 1; пагинация истории; материализованное представление — только при доказанной необходимости.

**Confidence:** HIGH — CONCERNS.md Performance.

---

### Pitfall 10: История ученика = склейка 5 источников без единой шкалы времени

**What goes wrong:** UI показывает занятия, оценки, задания, смены преподавателя в разном порядке: `Session.date` (календарный день), `StepCompletion.createdAt`, `AuditEvent.createdAt` в UTC без timezone medrese.

**Prevention:** Единый тип `TimelineEntry` с `occurredAt` (UTC) + `displayDate` (локаль medrese); сортировка на сервере; использовать `calendar-date.ts` везде.

**Confidence:** MEDIUM.

---

### Pitfall 11: Замещение + отпуска без связи с группой и календарём

**What goes wrong:** Замещение на учителя, но не на его группы; отпуск одобрен, но журнал всё ещё требует «владельца» группы; авто-замещение создаёт конфликт двух substitute на одну группу.

**Prevention:** Замещение всегда `(substituteId, groupId, range)`; уникальный partial index «один active substitute per group»; календарь отпусков — источник для cron авто-замещения.

**Confidence:** MEDIUM — K-12 substitute patterns (NetChex, OpenEduCat); точные бизнес-правила medrese — LOW.

---

### Pitfall 12: Auto-logout 1ч ломает незавершённый урок

**What goes wrong:** JWT истекает, черновик в Zustand теряется, таймер на сервере остаётся открытым.

**Prevention:** Перед logout — предупреждение; серверный draft session; auto-end с `closedReason: INACTIVITY`.

**Confidence:** HIGH для риска потери данных; MEDIUM для UX policy.

---

### Pitfall 13: Логирование входов без rate-limit на login

**What goes wrong:** Добавляют `LoginEvent` в audit, но не закрывают brute-force 6-значных кодов — логи забиты, атака не остановлена.

**Prevention:** Rate-limit и audit в одной фазе безопасности; не откладывать.

**Confidence:** HIGH — CONCERNS.md Security.

---

### Pitfall 14: E2E покрывают happy path, регрессии auth/analytics проходят в prod

**What goes wrong:** 5 e2e-файлов, нет unit-тестов на `step-completion.ts`, `sync-completions-for-progress.ts`. Рефактор аналитики ломает норматив 48ч незаметно.

**Prevention:** Unit-тесты на чистые функции расчёта; API auth matrix tests; расширить `e2e/journal.spec.ts` на таймер start/end.

**Confidence:** HIGH — CONCERNS.md Test Coverage.

---

## Minor Pitfalls

### Pitfall 15: Дублирование бизнес-правил в server actions и API routes

**What goes wrong:** Журнал пишет через `POST /api/sessions`, админка — через actions; правило «исключить adjustment» копируют в двух местах.

**Prevention:** Shared domain services в `src/shared/lib/` или `src/features/*/model/`; actions и routes — тонкие обёртки.

---

### Pitfall 16: `revalidatePath` без учёта новых страниц истории/карточки

**What goes wrong:** После сохранения урока история ученика stale до hard refresh.

**Prevention:** Явный список путей revalidation; React Query `invalidateQueries` для client-heavy views.

---

### Pitfall 17: Уведомления (фаза 3) до стабилизации событийной модели

**What goes wrong:** Колокольчик подписан на сырые DB triggers; события дублируются при `deleteMany` + recreate completions.

**Prevention:** Domain events из audit/service layer; идемпотентные notification keys.

---

### Pitfall 18: Пакетное именование и beta next-auth при расширении session claims

**What goes wrong:** Добавление `substitutionId` в JWT ломает сессию при upgrade `next-auth@5.0.0-beta.30`.

**Prevention:** Тест auth после каждого изменения claims; план миграции на stable v5.

**Confidence:** MEDIUM — CONCERNS.md Dependencies at Risk.

---

## Phase-Specific Warnings

| Phase / Topic | Likely Pitfall | Mitigation | Research flag |
|---------------|----------------|------------|---------------|
| **Фаза 1 — аналитика ученика** | Синтетические сессии в метриках | `sessionType` / filter layer до первого дашборда | NO — решение известно |
| **Фаза 1 — таймер урока** | Client-only timer | Server `startedAt`/`endedAt` + idempotency | NO |
| **Фаза 1 — норматив 48ч** | Смешение `Step.hours` и фактического времени | Явная продуктовая дефиниция + отдельные поля | **YES** — уточнить у заказчика: 48ч по программе или по таймеру |
| **Фаза 1 — исключение «зачтено ранее»** | Нет поля provenance на completion | `StepCompletion.source` или аналог | NO |
| **Фаза 1 — история ученика** | API auth bypass | Закрыть auth gap **до** новых endpoints | **YES** — матрица ролей |
| **Фаза 2 — допзадания** | Путаница с StepCompletion | Отдельная сущность Assignment | MEDIUM research |
| **Фаза 2 — смена преподавателя** | Audit без причины | Обязательное поле + audit event | NO |
| **Фаза 2 — замещение** | switchUser без scope | Substitution model + JWT claims | **YES** — JWT/impersonation design |
| **Фаза 2 — отпуска + авто-замещение** | Двойное назначение substitute | DB constraint + календарь | **YES** — бизнес-правила |
| **Фаза 2 — безопасность** | Login audit без rate-limit | Единый security slice | NO |
| **Фаза 3 — аудит UI** | Запросы full table scan | Индексы + пагинация + фильтры | NO |
| **Фаза 3 — аналитика преподавателя** | Login time vs lesson start в разных TZ | Server UTC + calendar-date | MEDIUM |
| **Фаза 3 — чат** | Shadow PII вне audit | Out of scope v1; не смешивать с audit | Deferred |

## Dependency Order (что ломается при нарушении порядка)

```
API auth baseline ──┬──► student history API
                    ├──► assignment endpoints
                    └──► audit export

sessionType / provenance ──► аналитика фазы 1 ──► норматив 48ч ──► история ученика

progress service (stepId not idx) ──► допзадания ──► карточка ученика

substitution model ──► замещение ──► отпуска/авто-замещение ──► запрет чужого входа

append-only audit ──► аудит UI ──► аналитика преподавателя (время входа vs урок)
```

**Критично:** Не начинать фазу 1 «история + аналитика» без решения по synthetic sessions и без минимального API auth hardening — иначе строится отчётность на заведомо ложных данных и дырявом периметре.

## Anti-Patterns to Avoid (краткий справочник)

| Anti-pattern | Вместо этого |
|--------------|--------------|
| Boolean `completed` без попыток/времени | События с timestamp и автором |
| Один `Session` на всё | Типизированные сессии или отдельные adjustment records |
| История через пересчёт текущего `currentStepIdx` | Immutable `stepId` + snapshot |
| Аудит через `updatedAt` | Append-only `AuditEvent` |
| Замещение через switchUser | Scoped substitution + claims |
| Таймер в localStorage | Server timestamps |
| Новые `/api/*` без тестов STUDENT | Auth matrix tests в CI |

## Sources

| Source | Topic | Confidence |
|--------|-------|------------|
| `.planning/codebase/CONCERNS.md` | API auth, synthetic sessions, step index, analytics perf | HIGH |
| `.planning/PROJECT.md` | Scope фаз 1–3, норматив 48ч, ручной таймер | HIGH |
| `src/shared/lib/analytics.ts`, `sync-completions-for-progress.ts`, `api/sessions/route.ts` | Текущее поведение | HIGH |
| [Acquaintsoft LMS Architecture 2026](https://acquaintsoft.com/blog/how-learning-management-systems-work) | Append-only audit, не перезаписывать attempts | MEDIUM |
| [Meridian KS — LMS Reporting Failures](https://meridianks.com/why-lms-reporting-is-where-most-implementations-fail/) | Reporting as afterthought | MEDIUM |
| [Brain Station 23 — Audit-Ready LMS](https://brainstation-23.com/audit-ready-moodle-lms/) | Incomplete logs, weak access control | MEDIUM |
| [LMSPedia — completion vs success status](https://lmspedia.org/lms-database-architecture-guide/) | Разные статусы «завершено» и «зачтено» | MEDIUM |
| [TimeFYI — Server vs Client Time](https://timefyi.com/guides/tech-time/server-vs-client-time/) | Таймеры и audit — server time | HIGH |
| [OpenEduCat — Substitute Management](https://openeducat.org/articles/substitute-teacher-management-software-guide/) | Связь absence + substitute records | MEDIUM |
| [Magic EdTech — Single Source of Truth](https://www.magicedtech.com/blogs/building-a-single-source-of-truth-without-rip-and-replace/) | Validate at ingest, shadow spreadsheets | MEDIUM |

---

*Pitfalls research for medrese-book milestone extensions. Do not commit from researcher — orchestrator handles.*
