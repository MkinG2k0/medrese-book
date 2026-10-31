# Phase 10: Subject Foundation - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза 10 доставляет **фундамент предметной модели в данных и админке**:

- Prisma-схема: `Subject`, привязка `Level` → `Subject`, fresh start (без миграции старых completions)
- CRUD предметов для MANAGER / SUPER_ADMIN
- Редактор программы предмета (уровни → шаги, Tiptap) в контексте выбранного предмета
- Seed с 3+ демо-предметами

**Вне скоупа фазы 10:** группы и зачисление (Phase 11), прогресс/сессии (Phase 12), журнал (Phase 13), аналитика (Phase 14), портал ученика (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Предмет (модель и UI)
- **D-01:** Поля предмета: **название** (обязательное) + **описание** (опциональное). Порядок сортировки, иконка — не в v2.0 Phase 10.
- **D-02:** Удаление предмета **запрещено**, если у предмета есть уровни или шаги. Пользователь должен сначала удалить программу, затем предмет.
- **D-03:** Программа — **шаблон на предмет** (milestone): все группы по предмету будут делить одну программу (реализация групп — Phase 11).

### Админка и маршруты
- **D-04:** Новый раздел **`/admin/subjects`** — список предметов, создание/редактирование/удаление.
- **D-05:** Редактор программы: **`/admin/subjects/[subjectId]/program`** — уровни и шаги в контексте предмета (аналог текущего `/admin/program/[levelId]`).
- **D-06:** Маршрут **`/admin/program` удалить** (не редирект, не deprecated). Навигация в AppShell обновляется на «Предметы».
- **D-07:** Доступ: MANAGER + SUPER_ADMIN (как текущая админка программы).

### Схема данных (fresh start)
- **D-08:** Milestone fresh start: новая схема с `Subject`; старые глобальные `Level` без `subjectId` заменяются. Миграция старых completions **не делается**.
- **D-09:** `Level` получает обязательный `subjectId`. Уникальность уровня: `@@unique([subjectId, number])` вместо глобального `number @unique`.
- **D-10:** `Step` остаётся привязан к `Level`; уникальность шага: `@@unique([levelId, order])` без изменений.

### Seed
- **D-11:** Минимум **3 предмета** с разным объёмом программы:
  1. **Коран** — полная программа (перенести/адаптировать текущую seed-программу)
  2. **Таджвид** — меньше уровней/шагов
  3. **Арабский язык** — свой набор уровней/шагов
- **D-12:** Seed должен демонстрировать мультипредметность на уровне данных (разные программы), без привязки к группам (группы — Phase 11).

### Структура кода
- **D-13:** Новая фича **`src/features/subject-admin/`** — CRUD предметов, UI списка/формы.
- **D-14:** Рефакторинг **`src/features/program-admin/`** — все операции с уровнями/шагами принимают `subjectId`; страницы под `/admin/subjects/[subjectId]/program/...`.
- **D-15:** Переиспользовать существующие компоненты: `StepEditor`, `BlockRenderer`, `LevelsTable`, `LevelStepsTable`, `StepForm`, Tiptap extensions — без дублирования редактора.

### Claude's Discretion
- Точные названия server actions и Zod-схем (`subject.ts` в validations).
- Количество уровней/шагов для «Таджвид» и «Арабский язык» в seed (главное — заметно отличаться от Корана).
- Порядок миграции: одна Prisma migration vs разбивка — на усмотрение planner/executor при сохранении fresh start.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & requirements
- `.planning/PROJECT.md` — milestone v2.0 goals, key decisions
- `.planning/REQUIREMENTS.md` — SUBJ-01…SUBJ-04, SUBJ-18
- `.planning/ROADMAP.md` — Phase 10 goal and success criteria

### Existing program admin (референс для рефакторинга)
- `src/features/program-admin/actions/program-actions.ts` — CRUD уровней/шагов
- `src/features/program-admin/ui/LevelsTable.tsx` — список уровней
- `src/features/program-admin/ui/LevelStepsTable.tsx` — шаги уровня
- `src/features/program-admin/ui/editor/StepEditor.tsx` — Tiptap-редактор
- `src/app/(dashboard)/admin/program/` — текущие маршруты (заменить на subjects)

### Schema & seed
- `prisma/schema.prisma` — текущие `Level`, `Step`
- `prisma/seed.ts` — текущая программа Корана
- `prisma/data/` — import-данные программы (если используются)

### Navigation & access
- `src/widgets/app-shell/ui/AppShell.tsx` — пункт меню `/admin/program` → `/admin/subjects`
- `src/shared/lib/session.ts` — `requireRoles(['MANAGER', 'SUPER_ADMIN'])`

### Conventions
- `.planning/codebase/CONVENTIONS.md` — FSD, naming, server actions pattern
- `.cursor/rules/prisma-migrations.mdc` — безопасные миграции на prod

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`program-admin` feature** — полный стек редактора программы: actions, LevelsTable, StepForm, StepEditor, BlockRenderer, ArabicBlock.
- **`StepContentPreview`** — превью контента шага (используется в журнале и допзаданиях; не ломать публичный API при рефакторинге).
- **Tiptap mapper** — `src/features/program-admin/lib/tiptap-mapper.ts` для сериализации ContentBlock.

### Established Patterns
- Server actions + `revalidatePath` после мутаций программы.
- Zod-схемы в `src/shared/lib/validations/`.
- Админ-страницы: Server Component + `requireRoles`, client forms через react-hook-form.
- Prisma: `Level.number` глобально unique сейчас — **нужно изменить** на unique per subject.

### Integration Points
- **AppShell** — заменить пункт «Программа» на «Предметы», key `/admin/subjects`.
- **E2E** — обновить тесты, ссылающиеся на `/admin/program` (если есть).
- **Extra assignments / posts** — импортируют StepEditor/BlockRenderer; не трогать в Phase 10 beyond ensuring imports still work.

</code_context>

<specifics>
## Specific Ideas

- UX как сейчас: список уровней → клик → шаги уровня → редактор шага с Tiptap.
- Пользователь явно выбрал **убрать** `/admin/program`, не оставлять deprecated.
- Seed-предметы: **Коран**, **Таджвид**, **Арабский язык**.

</specifics>

<deferred>
## Deferred Ideas

- Привязка группы к предмету (`group.subjectId`) — Phase 11
- Прогресс ученика по предмету — Phase 12
- Журнал и аналитика по предмету — Phases 13–14
- Порядок сортировки предметов в списках — отложено (не выбрано пользователем)
- Мягкое удаление (archived) — отклонено в пользу block-if-levels

</deferred>

---

*Phase: 10-Subject Foundation*
*Context gathered: 2026-07-07*
