# Project Research Summary

**Project:** Электронный дневник медресе (medrese-book)
**Domain:** Узкоспециализированный электронный журнал / LMS для индивидуального обучения Корану (brownfield)
**Researched:** 2026-06-24
**Confidence:** HIGH

## Executive Summary

Medrese-book — не полноценный LMS, а **журнал посещаемости и успеваемости** с моделью 1:1 (ученик ↔ преподаватель ↔ группа) и прогрессом по шагам программы. Эксперты в этой нише строят системы вокруг **истории занятий, посещаемости, прогресса по программе и операционного контроля** (замены, допзадания, аудит) — без ML-аналитики, xAPI и enterprise-дашбордов. Исследование подтверждает утверждённый бэклог PROJECT.md: фаза 1 — аналитика ученика, фаза 2 — операционное управление, фаза 3 — коммуникации и compliance.

Рекомендуемый подход — **brownfield-расширение** существующего стека (Next.js 16 + Prisma 7 + PostgreSQL + FSD) с минимумом новых npm-пакетов. Доменная логика остаётся в Prisma и server actions; новые зависимости только там, где экосистема даёт проверенное решение (`react-idle-timer`, `isomorphic-dompurify`, опционально Upstash rate limit). Архитектурно — вертикальные feature-слайсы (`student-profile`, `assignments`, `leave`, `substitutions`) плюс горизонтальные shared-сервисы (`student-progress`, `student-metrics`, `domain-events`, `audit`, `notifications`). Сквозные побочные эффекты (аудит + уведомления) — через единый `dispatchDomainEvent`, не через импорты между features.

Главные риски — **техдолг существующей кодовой базы**, а не выбор стека: синтетические сессии из `syncCompletionsForProgress` искажают аналитику; три разных понятия «времени» (программа, таймер, опоздание) легко смешать; API `/api/*` без единого auth wrapper; замещение через `switchUser` без scoped substitution. Митигация: **Stage 0 (foundation)** до любых пользовательских фич — фильтры `isAdjustment`/`isPriorCredit`, `authorizeApiRequest`, refactor `student-progress`, `domain-events` + `AuditEvent`. Без этого фаза 1 построит отчётность на ложных данных и дырявом периметре.

## Key Findings

### Recommended Stack

Стек не меняется — дополняется. Принцип: максимум логики в Prisma + server actions; новые npm только при доказанной необходимости.

**Core technologies:**
- **Next.js 16 + Prisma 7 + PostgreSQL** — существующий brownfield-стек; все новые модели через Prisma migrations — HIGH confidence
- **Zustand + date-fns + Ant Design** — таймер урока: server `startedAt`/`endedAt` как источник истины, клиент только отображает elapsed — HIGH
- **Prisma `AuditEvent` + Next.js `after()`** — append-only аудит без блокировки ответа; критичные события (impersonation) — await — HIGH
- **React Query polling (30–60s) + sonner + Ant Design Badge** — in-app уведомления без WebSocket/SSE в v1 — HIGH
- **date-fns + HTTP cron (Coolify) + Prisma** — отпуска и авто-замещение; не `node-cron` в процессе — HIGH
- **`react-idle-timer` ^5.7.3 + NextAuth `maxAge`** — автовыход 1ч бездействия; не sliding session — HIGH
- **`@upstash/ratelimit` + `isomorphic-dompurify`** — rate limit на login (MEDIUM — зависит от политики внешних сервисов; fallback: PostgreSQL bucket) и XSS-санитизация шагов — MEDIUM/HIGH

**Явно не добавлять:** socket.io, BullMQ, Novu, react-big-calendar, audit SaaS, timer hooks — over-engineering для масштаба медресе.

### Expected Features

**Must have (table stakes):**
- История занятий с датой, посещаемостью, оценками — без неё журнал бесполезен
- Прогресс по уровням/шагам, средний балл за период, посещаемость — стандарт Дневник.ру/МЭШ
- Длительность урока + таймер + общее время + норматив 48ч — **доменный differentiator medrese**, но обязателен по бэклогу
- Исключение «зачтено ранее» из метрик — иначе аналитика врёт при переводе ученика
- Карточка ученика, статусы lifecycle, допзадания (назначение, срок, статус, результат)
- Отпуска + approval + замещение + запрет чужого входа
- Login/logout audit, session timeout, журнал аудита с фильтрами
- Колокольчик уведомлений (5–7 типов событий, без чата в v1)

**Should have (differentiators medrese):**
- Ручной таймер урока (редко в школьных журналах; ценно для индивидуального обучения)
- Единая хронологическая лента (занятия + оценки + задания)
- Смена постоянного преподавателя с обязательной причиной
- Аналитика преподавателя (время входа vs начало урока) — фаза 3
- Привязка допзадания к конкретному шагу программы

**Defer (v2+):**
- ML/предиктивная аналитика, xAPI, 95+ BI-фильтров — anti-features для масштаба
- Экспорт CSV/PDF, email/SMS/Telegram — in-app first
- Аналитика допзаданий, чат (отдельный scope фазы 3), push/PWA
- Real-time WebSocket для badge-уведомлений

### Architecture Approach

Расширять FSD **вертикальными feature-слайсами** по пользовательским сценариям и **горизонтальными shared-сервисами** для сквозной логики. Разделить `features/analytics` (агрегаты: топ, уровни) и `features/student-profile` (карточка + timeline). Features не импортируют друг друга — общение через `shared/lib/domain-events/`.

**Major components:**
1. **`shared/lib/student-progress/`** — единственная точка пересчёта `currentStepIdx`, исключение prior credit, offsets — разгружает 8+ файлов техдолга
2. **`shared/lib/student-metrics/`** — per-student DTO: уроки, шаги, время, нарушение 48ч; потребители: profile, analytics, journal, portal
3. **`shared/lib/domain-events/`** — fan-out в audit + notifications после мутаций; features не вызывают write-audit напрямую
4. **`features/journal` (+timer)** — таймер внутри сценария урока; `PATCH /api/sessions/.../timer` для start/end
5. **`features/student-profile`** — единый источник правды для карточки и timeline на `/students/[studentId]`
6. **`features/assignments`, `features/leave`, `features/substitutions`** — операционное управление; leave оркестрирует substitution через domain event
7. **`features/notifications` + `widgets/notification-bell`** — polling UI; `features/audit-log` — read-only viewer

### Critical Pitfalls

1. **Аналитика поверх «грязных» сессий** — синтетические сессии из `syncCompletionsForProgress` завышают прогресс → ввести `isAdjustment`/`sessionType` и единый фильтр в `analytics-queries` **до** первого дашборда
2. **Смешение трёх понятий времени** — `Step.hours` (программа) ≠ `durationMinutes` (таймер) ≠ `lateMinutes` → три явные метрики в UI/API; уточнить у заказчика: 48ч по программе или по таймеру
3. **Таймер только на клиенте** — потеря данных при закрытии вкладки → server `startedAt`/`endedAt` как источник истины; идемпотентность: один активный урок на `(studentId, calendarDay)`; auto-close stale sessions
4. **Новые API без закрытия auth gap** — `GET /api/sessions` уже отдаёт чужие данные → `authorizeApiRequest()` + default-deny **до** фазы 1 endpoints; auth matrix tests в CI
5. **Замещение через `switchUser` без scope** — учитель A работает в журнале B после окончания замещения → модель `TeacherSubstitution` + JWT claims `actingAsTeacherId`/`substitutionId`, не полный switch
6. **Аудит как afterthought** — `deleteMany` + recreate completions уничтожает историю → append-only `AuditEvent`; критичные мутации через сервис в той же транзакции
7. **Глобальный `currentStepIdx` для заданий/истории** — задания «переезжают» при reorder программы → хранить `stepId` (UUID), snapshot title/level на момент события

## Implications for Roadmap

Based on research, suggested phase structure:

### Stage 0: Foundation (обязательный пролог)
**Rationale:** Все три исследования сходятся: без foundation фазы 1–3 строятся на техдолге CONCERNS.md.
**Delivers:** Prisma flags (`isAdjustment`, `isPriorCredit`), `student-progress` refactor, `domain-events` + `AuditEvent` model, `authorizeApiRequest()` helper, `analytics-queries` extract с exclusion filters
**Addresses:** Исключение «зачтено ранее», корректная аналитика, безопасность API
**Avoids:** Pitfalls 1, 4, 6, 7 — dirty analytics, auth bypass, audit afterthought, scattered progress logic
**Research flag:** Stage 0.4 (API auth) — middleware vs wrapper; решить в `/gsd-research-phase`

### Phase 1: Student Analytics & History
**Rationale:** Ядро Core Value («реальный прогресс и вовремя вмешаться»); зависит только от Stage 0.
**Delivers:** Таймер урока (start/end UI + API), `student-metrics` + 48h norm warning, `/students/[studentId]` timeline, расширенная monthly analytics с drill-down, student-portal time/progress
**Addresses:** Длительность урока, пройденные шаги/уроки, общее время, история, норматив 48ч, исключение зачёта
**Avoids:** Pitfalls 1–3, 9 — dirty sessions, time mixing, client-only timer, in-memory aggregates
**Research flag:** **YES** — дефиниция норматива 48ч (программа vs таймер); стандартные паттерны таймера — skip

### Phase 2: Operations (Students, Assignments, Staff, Security)
**Rationale:** Операционное управление требует стабильной карточки (фаза 1) и domain-events (Stage 0).
**Delivers:** Статусы ученика, смена преподавателя с причиной, справочник + назначение допзаданий, substitutions CRUD + auth guard, leave calendar + approval + auto-substitute cron, idle timeout + login audit + rate limit
**Uses:** `react-idle-timer`, `isomorphic-dompurify`, Upstash или PG rate limit, HTTP cron + `CRON_SECRET`, `date-fns` overlap checks
**Implements:** `features/assignments`, `features/leave`, `features/substitutions`, `features/auth` security extensions
**Avoids:** Pitfalls 5, 8, 11–13 — switchUser substitution, assignment lifecycle gaps, double substitute, login without rate-limit
**Research flag:** **YES** — JWT/impersonation design для замещения; auto-substitute business rules (кто назначается); MEDIUM — assignment status model

### Phase 3: Communications & Compliance
**Rationale:** Уведомления и аудит UI зависят от событийной модели (Stage 0) и доменных сущностей (фазы 1–2); не блокируют фазы 1–2.
**Delivers:** Notification bell + polling API, full notifications page, `/admin/audit` viewer, teacher analytics (login vs lesson start)
**Addresses:** Колокольчик, событийные уведомления, журнал аудита, аналитика преподавателя
**Avoids:** Pitfalls 17 — notifications до стабилизации event model; WebSocket over-engineering
**Research flag:** **YES** — чат (отдельная архитектура, не часть notifications v1); LOW — polling interval 30s vs 60s

### Phase Ordering Rationale

- **Stage 0 перед всем** — единственный способ избежать переписывания аналитики и утечек PII; dependency graph из ARCHITECTURE.md и PITFALLS.md сходятся
- **Фаза 1 = аналитика ученика** — без таймера и корректных фильтров норматив 48ч бессмысленен; таймер и metrics параллелизуются после Stage 0
- **Фаза 2 группирует операции** — карточка (1.3) → статусы; substitutions (2.4) → leave (2.5); security (2.6) можно начать рано после domain-events
- **Фаза 3 = observability** — audit write path в Stage 0, UI в фазе 3; notifications потребляют события из фаз 1–2
- **Чат в фазе 3 — отдельный workstream**, не смешивать с notification bell

### Research Flags

Phases likely needing deeper research during planning:
- **Stage 0 / API auth:** middleware для `/api/*` vs per-route wrapper — CONCERNS.md gap blocks safe scaling
- **Phase 1 / 48h normative:** calendar hours vs `durationMinutes` vs `Step.hours` — business rule от заказчика
- **Phase 2 / substitution JWT:** `actingAsTeacherId` + `substitutionId` claims vs full switchUser — security-critical
- **Phase 2 / auto-substitute:** кого назначать при отпуске — менеджер выбирает vs автоматический matching
- **Phase 3 / chat:** отдельная архитектура (SSE/WebSocket) — не часть notifications v1

Phases with standard patterns (skip research-phase):
- **Phase 1 / lesson timer:** server timestamp + client display — industry LMS pattern, HIGH confidence
- **Phase 1 / prior credit exclusion:** Prisma flags + shared filter — решение известно из CONCERNS.md
- **Phase 3 / notification polling:** React Query + Prisma — self-hosted Docker, низкая частота событий
- **Phase 3 / audit viewer:** paginated read + date index — стандартный CRUD

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Brownfield — дополнения проверены по кодовой базе и official Next.js/Upstash docs; Upstash — MEDIUM из-за внешней зависимости |
| Features | HIGH | Table stakes подтверждены Дневник.ру/МЭШ + PROJECT.md; ML/enterprise — явно anti-features |
| Architecture | HIGH | Grounded в `.planning/codebase/ARCHITECTURE.md` + FSD official guidance; build order с dependency graph |
| Pitfalls | HIGH | Подтверждено кодом (`sync-completions`, `sessions/route.ts`, CONCERNS.md); бизнес-правила замещения — MEDIUM |

**Overall confidence:** HIGH

### Gaps to Address

- **Норматив 48 часов:** уточнить у заказчика — по часам программы (`Step.hours`) или по фактическому времени таймера; блокирует корректную реализацию warning в фазе 1
- **Auto-substitute rules:** при одобрении отпуска — менеджер выбирает замену или система предлагает; влияет на UX leave flow
- **Upstash vs PostgreSQL rate limit:** политика внешних сервисов; PG bucket — zero-infra fallback
- **DB-level audit immutability:** PostgreSQL trigger + отдельный DB role — ops-договорённость, не блокер MVP
- **Auto-close stale lessons:** policy N часов для незавершённых уроков — нужно уточнение у заказчика
- **Chat architecture (фаза 3):** отложено; не планировать вместе с notification bell

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — утверждённый бэклог, фазы, constraints
- `.planning/codebase/CONCERNS.md` — API auth gaps, synthetic sessions, step index debt
- `.planning/codebase/ARCHITECTURE.md`, `STACK.md` — существующие паттерны brownfield
- [Next.js 16 `after()` official](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/04-functions/after.mdx) — audit write pattern
- [FSD Next.js guide](https://feature-sliced.design/docs/guides/tech/with-nextjs) — brownfield FSD boundaries
- [Дневник.ру / МЭШ](https://support.dnevnik.ru/) — table stakes аналитики и допзаданий

### Secondary (MEDIUM confidence)
- [Upstash Ratelimit v2.0.8](https://github.com/upstash/ratelimit-js/releases/tag/v2.0.8) — rate limit на login
- [SSE vs polling decision matrix 2026](https://wolf-tech.io/blog/nextjs-15-sse-vs-websockets-vs-polling-real-time-decision-matrix-2026) — polling для badge
- [Audit logging Next.js + Postgres](https://michaeldishmon.com/writing/audit-logging-healthcare-nextjs) — append-only pattern
- [OpenEduCat / TimetableMaster](https://openeducat.org/) — substitute workflow (упрощён для medrese)
- [TimeFYI — Server vs Client Time](https://timefyi.com/guides/tech-time/server-vs-client-time/) — timer source of truth

### Tertiary (LOW confidence)
- [Gradelink Grade Alerts](https://gradelink.com/) — пороговые уведомления — опционально, фаза 4
- [Canvas/D2L predictive analytics](https://www.d2l.com/blog/lms-analytics/) — подтверждает defer ML для medrese

---
*Research completed: 2026-06-24*
*Ready for roadmap: yes*
