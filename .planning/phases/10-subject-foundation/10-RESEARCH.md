# Phase 10: Subject Foundation - Research

**Researched:** 2026-07-07
**Domain:** Prisma schema evolution, FSD feature modules, Next.js App Router admin CRUD
**Confidence:** HIGH

## Summary

Фаза 10 вводит сущность **Subject** как владельца учебной программы (уровни → шаги), переносит редактор программы под маршруты `/admin/subjects/[subjectId]/program/...`, добавляет CRUD предметов в новой фиче `subject-admin`, и обновляет seed на три демо-предмета. Технически это **brownfield-рефакторинг** существующего `program-admin` + **additive Prisma migration** — новых npm-пакетов не требуется.

Ключевое архитектурное решение: **программа скоупится по `subjectId`**, а глобальный `Level.number @unique` заменяется на `@@unique([subjectId, number])` [CITED: prisma.io/docs — composite @@unique]. Миграция на test/prod должна быть **безопасной** (CREATE TABLE, ADD COLUMN, backfill, индексы) — без TRUNCATE/DROP данных [CITED: `.cursor/rules/prisma-migrations.mdc`]. «Fresh start» из CONTEXT означает: **не переносить completions в мультипредметную модель** и полностью пересобирать демо-данные через `pnpm db:seed` локально; на prod существующие уровни привязываются к дефолтному предмету «Коран».

**Primary recommendation:** Одна Prisma-миграция (Subject + Level.subjectId + composite unique) → `subject-admin` по паттерну `groups` → рефакторинг `program-admin` с обязательным `subjectId` во всех запросах и ссылках → новые маршруты + удаление `/admin/program` → seed трёх предметов.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Subject CRUD (создание/редактирование/удаление) | API / Backend (server actions) | Browser (Ant Design forms) | Бизнес-правила (запрет удаления при уровнях) и Prisma — на сервере |
| Program editor (levels/steps/Tiptap) | API / Backend + Frontend Server (RSC pages) | Browser (client StepEditor) | Данные через server actions; интерактивный редактор — client component |
| Subject/Level data model | Database / Storage | API / Backend (Prisma) | Subject и Level.subjectId — персистентный слой |
| Navigation (`/admin/subjects`) | Frontend Server (AppShell RSC) | — | Меню рендерится в layout, маршруты защищены middleware |
| Step global numbering (within subject) | API / Backend (`student-progress/offsets`) | Frontend Server (level steps page) | Offset считается по уровням одного предмета |
| Demo seed (3 subjects) | Database / Storage (seed scripts) | — | `prisma/seed.ts` + `prisma/lib/seed-program.ts` |
| AuthZ (MANAGER/SUPER_ADMIN) | Frontend Server + API / Backend | — | `requireRoles` на страницах и в actions; `/admin/*` в middleware |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Предмет (модель и UI)
- **D-01:** Поля предмета: **название** (обязательное) + **описание** (опциональное). Порядок сортировки, иконка — не в v2.0 Phase 10.
- **D-02:** Удаление предмета **запрещено**, если у предмета есть уровни или шаги. Пользователь должен сначала удалить программу, затем предмет.
- **D-03:** Программа — **шаблон на предмет** (milestone): все группы по предмету будут делить одну программу (реализация групп — Phase 11).

#### Админка и маршруты
- **D-04:** Новый раздел **`/admin/subjects`** — список предметов, создание/редактирование/удаление.
- **D-05:** Редактор программы: **`/admin/subjects/[subjectId]/program`** — уровни и шаги в контексте предмета (аналог текущего `/admin/program/[levelId]`).
- **D-06:** Маршрут **`/admin/program` удалить** (не редирект, не deprecated). Навигация в AppShell обновляется на «Предметы».
- **D-07:** Доступ: MANAGER + SUPER_ADMIN (как текущая админка программы).

#### Схема данных (fresh start)
- **D-08:** Milestone fresh start: новая схема с `Subject`; старые глобальные `Level` без `subjectId` заменяются. Миграция старых completions **не делается**.
- **D-09:** `Level` получает обязательный `subjectId`. Уникальность уровня: `@@unique([subjectId, number])` вместо глобального `number @unique`.
- **D-10:** `Step` остаётся привязан к `Level`; уникальность шага: `@@unique([levelId, order])` без изменений.

#### Seed
- **D-11:** Минимум **3 предмета** с разным объёмом программы:
  1. **Коран** — полная программа (перенести/адаптировать текущую seed-программу)
  2. **Таджвид** — меньше уровней/шагов
  3. **Арабский язык** — свой набор уровней/шагов
- **D-12:** Seed должен демонстрировать мультипредметность на уровне данных (разные программы), без привязки к группам (группы — Phase 11).

#### Структура кода
- **D-13:** Новая фича **`src/features/subject-admin/`** — CRUD предметов, UI списка/формы.
- **D-14:** Рефакторинг **`src/features/program-admin/`** — все операции с уровнями/шагами принимают `subjectId`; страницы под `/admin/subjects/[subjectId]/program/...`.
- **D-15:** Переиспользовать существующие компоненты: `StepEditor`, `BlockRenderer`, `LevelsTable`, `LevelStepsTable`, `StepForm`, Tiptap extensions — без дублирования редактора.

### Claude's Discretion
- Точные названия server actions и Zod-схем (`subject.ts` в validations).
- Количество уровней/шагов для «Таджвид» и «Арабский язык» в seed (главное — заметно отличаться от Корана).
- Порядок миграции: одна Prisma migration vs разбивка — на усмотрение planner/executor при сохранении fresh start.

### Deferred Ideas (OUT OF SCOPE)
- Привязка группы к предмету (`group.subjectId`) — Phase 11
- Прогресс ученика по предмету — Phase 12
- Журнал и аналитика по предмету — Phases 13–14
- Порядок сортировки предметов в списках — отложено (не выбрано пользователем)
- Мягкое удаление (archived) — отклонено в пользу block-if-levels
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUBJ-01 | Менеджер и супер-админ создают, редактируют и удаляют предметы | `subject-admin` feature по паттерну `groups`; Zod + server actions; UI-SPEC copywriting |
| SUBJ-02 | У каждого предмета своя учебная программа: уровни → шаги | `Level.subjectId` FK; subject-scoped `program-admin` routes and queries |
| SUBJ-03 | Программа — шаблон на предмет | Subject owns Levels; no group binding in Phase 10 (data model only) |
| SUBJ-04 | Редактор программы предмета (уровни/шаги, Tiptap) доступен менеджеру и супер-админу | Reuse `StepEditor`/`StepForm`; `requireRoles`; new route tree under `/admin/subjects/[subjectId]/program` |
| SUBJ-18 | Новая Prisma-схема и seed для мультипредметной модели (fresh start) | Subject model migration; refactor `seed-program.ts` + `seed.ts` for 3 subjects |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

- **Prisma migrations (prod-safe):** после правки `schema.prisma` — `pnpm db:migrate -- --name ...`; на test/prod только `pnpm db:migrate:deploy`. Запрещены `migrate reset`, `db:push`, `db:seed` на prod [CITED: `.cursor/rules/prisma-migrations.mdc`].
- **SQL в миграции:** только безопасные операции (`CREATE TABLE`, `ADD COLUMN`, индексы). Без `DROP`/`DELETE`/`TRUNCATE` без явного запроса пользователя.
- **FSD:** новая фича в `src/features/subject-admin/`; `shared` не импортирует из `features`.
- **UI:** Ant Design 6, русский copy из `10-UI-SPEC.md`; не переопределять стили antd через Tailwind hex-цвета.
- **Auth:** `requireRoles(['MANAGER', 'SUPER_ADMIN'])` на админ-страницах; `/admin/*` уже защищён в `auth.config.ts`.
- **GSD workflow:** планирование через gsd-planner после этого research.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.8.0 | ORM, migrations, Subject/Level schema | Уже в проекте; единственный persistence layer |
| @prisma/client | 7.8.0 | Type-safe queries | Генерируется из `prisma/schema.prisma` |
| Next.js | 16.1.6 | App Router pages, server actions | Существующий full-stack фреймворк |
| Zod | 4.3.6 | Валидация subject/level input | Паттерн `src/shared/lib/validations/` |
| antd | 6.4.3 | SubjectsList table, modals, forms | UI-SPEC + паттерн `groups` |
| @tiptap/react | 3.26.x | Step content editor | Без изменений — reuse `StepEditor` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.71.2 | — | **Не использовать** в Phase 10 — `groups`/`subject-admin` на antd Form |
| vitest | 4.1.9 | Unit tests для delete-guard, offsets | Wave 0 validation gaps |
| @playwright/test | 1.61.0 | E2E (опционально) | Smoke `/admin/subjects` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server actions (groups pattern) | REST API routes | Проект уже использует server actions для admin CRUD — не вводить второй паттерн |
| Отдельная фича `program-admin` | Merge в `subject-admin` | CONTEXT D-14 требует отдельный рефакторинг `program-admin` — сохранить границу фич |

**Installation:** новые пакеты **не требуются**.

**Version verification:** Prisma 7.8.0, Next.js 16.1.6, Zod 4.3.6 — подтверждено в `package.json` [VERIFIED: codebase `package.json`].

## Package Legitimacy Audit

> Фаза не устанавливает внешние пакеты.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| — | — | — | No new packages |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
[Browser: MANAGER/SUPER_ADMIN]
    │
    ├─ GET /admin/subjects ──────────────► [RSC page] ──► getSubjects() ──► [Prisma: Subject]
    │       │
    │       ├─ Modal create/edit ────────► createSubject()/updateSubject() ──► Subject table
    │       └─ Delete confirm ───────────► deleteSubject() ──► guard: level count = 0
    │
    └─ GET /admin/subjects/{subjectId}/program
            │
            ├─ Levels list ──────────────► getLevels(subjectId) ──► Level WHERE subjectId
            │       └─ createLevel({subjectId, number, title})
            │
            └─ /program/{levelId}
                    ├─ Steps table ──────► getLevelSteps(levelId) + verify level.subjectId
                    ├─ StepForm/StepEditor ► createStep/updateStep (unchanged logic, new paths)
                    └─ global step # ────► getStepOffsetForLevel(subjectId, levelNumber)

[Middleware /auth.config] ──► /admin/* requires MANAGER | SUPER_ADMIN
[AppShell] ──► menu key /admin/subjects (удалить /admin/program)
```

### Recommended Project Structure

```
prisma/
├── schema.prisma              # +model Subject, Level.subjectId
├── migrations/.../            # additive migration SQL
├── lib/seed-program.ts        # seedProgram(prisma, { subjectId })
└── seed.ts                    # 3 subjects, Quran uses JSON import

src/features/
├── subject-admin/             # NEW
│   ├── actions/subject-actions.ts
│   ├── ui/SubjectsList.tsx
│   ├── ui/CreateSubjectForm.tsx
│   ├── ui/EditSubjectForm.tsx
│   └── index.ts
└── program-admin/             # REFACTOR
    ├── actions/program-actions.ts   # +subjectId scoping
    └── ui/LevelsTable.tsx           # +subjectId prop for links

src/app/(dashboard)/admin/
├── subjects/
│   ├── page.tsx
│   └── [subjectId]/program/
│       ├── page.tsx
│       └── [levelId]/
│           ├── page.tsx
│           └── steps/new|.../edit/page.tsx
└── program/                   # DELETE entire directory

src/shared/lib/validations/
└── subject.ts                 # NEW

src/widgets/app-shell/ui/AppShell.tsx  # menu update
```

### Pattern 1: Subject CRUD Server Actions (как `groups`)

**What:** `'use server'` actions с `requireRoles`, Zod parse, `revalidatePath`, throw/return на русском.
**When to use:** все мутации предметов.
**Example:**

```typescript
// Source: паттерн src/features/groups/actions/group-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import { createSubjectSchema, updateSubjectSchema } from '@/shared/lib/validations/subject'

export async function createSubject(input: unknown) {
  await requireRoles(['MANAGER', 'SUPER_ADMIN'])
  const data = createSubjectSchema.parse(input)
  const subject = await prisma.subject.create({ data })
  revalidatePath('/admin/subjects')
  return subject
}

export async function deleteSubject(subjectId: string) {
  await requireRoles(['MANAGER', 'SUPER_ADMIN'])
  const levelCount = await prisma.level.count({ where: { subjectId } })
  if (levelCount > 0) {
    throw new Error('Нельзя удалить предмет с программой. Сначала удалите все уровни.')
  }
  await prisma.subject.delete({ where: { id: subjectId } })
  revalidatePath('/admin/subjects')
}
```

### Pattern 2: Subject-Scoped Program Queries

**What:** Все `program-actions` фильтруют по `subjectId`; при доступе по `levelId` — проверка принадлежности уровня предмету.
**When to use:** любой read/write уровней и шагов после Phase 10.
**Example:**

```typescript
// Source: рефакторинг src/features/program-admin/actions/program-actions.ts
export async function getLevels(subjectId: string) {
  await requireRoles(['SUPER_ADMIN', 'MANAGER'])
  return prisma.level.findMany({
    where: { subjectId },
    include: { _count: { select: { steps: true } } },
    orderBy: { number: 'asc' },
  })
}

export async function getLevelSteps(subjectId: string, levelId: string) {
  await requireRoles(['SUPER_ADMIN', 'MANAGER'])
  return prisma.level.findFirst({
    where: { id: levelId, subjectId },
    include: { steps: { orderBy: { order: 'asc' } } },
  })
}
```

### Pattern 3: Prisma Subject Model + Composite Unique

**What:** Subject как root; Level с обязательным `subjectId` и `@@unique([subjectId, number])`.
**When to use:** `schema.prisma` Phase 10.
**Example:**

```prisma
// Source: [CITED: prisma.io/docs — @@unique composite]
model Subject {
  id          String   @id @default(cuid())
  name        String
  description String   @default("")
  levels      Level[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Level {
  id        String    @id @default(cuid())
  subjectId String
  subject   Subject   @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  number    Int
  title     String
  students  Student[]
  steps     Step[]

  @@unique([subjectId, number])
}
```

### Pattern 4: Prod-Safe Migration SQL (backfill)

**What:** Добавить Subject, backfill существующих Level под дефолтный предмет, затем NOT NULL + composite unique.
**When to use:** единственная миграция Phase 10 на test/prod.
**Example:**

```sql
-- Source: паттерн prisma/migrations/20260606120000_move_level_to_student/migration.sql
CREATE TABLE "Subject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Subject" ("id", "name", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Коран', '', NOW(), NOW());
-- Note: use cuid() equivalent or fixed id in actual migration

ALTER TABLE "Level" ADD COLUMN "subjectId" TEXT;

UPDATE "Level" SET "subjectId" = (SELECT "id" FROM "Subject" WHERE "name" = 'Коран' LIMIT 1);

ALTER TABLE "Level" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Level" ADD CONSTRAINT "Level_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Level_number_key";
CREATE UNIQUE INDEX "Level_subjectId_number_key" ON "Level"("subjectId", "number");
```

### Pattern 5: Subject-Scoped Step Offsets

**What:** `getLevelStepOffsets(subjectId)` — cumulative offsets только по уровням предмета; UI-SPEC требует global step number в скоупе предмета.
**When to use:** страница шагов уровня в program editor.
**Example:**

```typescript
// Source: рефакторинг src/shared/lib/student-progress/offsets.ts
export async function getLevelStepOffsets(subjectId: string): Promise<Map<number, number>> {
  const levels = await prisma.level.findMany({
    where: { subjectId },
    select: { number: true, _count: { select: { steps: true } } },
    orderBy: { number: 'asc' },
  })
  const offsets = new Map<number, number>()
  let cumulative = 0
  for (const level of levels) {
    offsets.set(level.number, cumulative)
    cumulative += level._count.steps
  }
  return offsets
}
```

### Anti-Patterns to Avoid

- **Редирект `/admin/program` → `/admin/subjects`:** CONTEXT D-06 запрещает — удалить маршруты полностью.
- **`db:push` для схемы:** ломает migrate history на prod.
- **Глобальный `getLevels()` без subjectId:** нарушает D-09 и смешивает программы.
- **Дублирование StepEditor:** D-15 — только props/path changes.
- **TRUNCATE в migration на prod:** противоречит prisma-migrations rule; wipe только через локальный `db:seed`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ORM / migrations | Raw SQL scripts вне Prisma | Prisma migrate + `schema.prisma` | История миграций, типы client |
| Form validation | Manual if-checks | Zod schemas in `validations/subject.ts` | Единый паттерн проекта |
| Auth on admin pages | Custom middleware per route | `requireRoles` + existing `/admin` rule | Уже работает в `auth.config.ts` |
| Rich step content | Custom editor | Existing Tiptap `StepEditor` | Сложный ArabicBlock, mapper |
| Delete confirmation | `window.confirm` | `App.useApp().modal.confirm` | UI-SPEC + groups pattern |

**Key insight:** Phase 10 — **композиция существующих паттернов** (groups CRUD + program-admin editor), а не новый доменный фреймворк.

## Common Pitfalls

### Pitfall 1: Prod migration vs fresh start

**What goes wrong:** Миграция с TRUNCATE ломает prod; или наоборот — dev seed не создаёт 3 предмета.
**Why it happens:** «Fresh start» в milestone смешивают с destructive prod deploy.
**How to avoid:** Migration = additive + backfill «Коран»; полный reset только `pnpm db:seed` локально.
**Warning signs:** `DELETE FROM` в `migration.sql`; seed создаёт только один предмет.

### Pitfall 2: Broken level create flow (существующий техдолг)

**What goes wrong:** Сейчас `/admin/program` ссылается на `/admin/program/new` и `/admin/program/[levelId]/edit`, но **маршрутов нет** [VERIFIED: codebase grep].
**Why it happens:** Незавершённый UI program-admin.
**How to avoid:** В Phase 10 реализовать создание уровня (модалка на странице программы предмета — предпочтение UI-SPEC).
**Warning signs:** 404 на «Новый уровень».

### Pitfall 3: Delete subject blocked forever (нет delete level)

**What goes wrong:** D-02 требует пустую программу для удаления предмета, но **`deleteLevel` не существует** в codebase [VERIFIED: codebase grep].
**Why it happens:** Раньше удаление уровней не понадобилось.
**How to avoid:** Добавить `deleteLevel` с guard (`students` count = 0, cascade steps) **или** явно задокументировать как ограничение Phase 10 (удаление только пустых предметов).
**Warning signs:** Пользователь не может удалить тестовый предмет с уровнями.

### Pitfall 4: Hardcoded `/admin/program` paths

**What goes wrong:** После рефакторинга 404 в `StepForm`, `LevelsTable`, `LevelStepsTable`, `revalidatePath`.
**Why it happens:** 15+ ссылок на старый prefix [VERIFIED: codebase grep].
**How to avoid:** Централизовать helper `programPaths(subjectId, levelId?)` или массовый поиск `admin/program`.
**Warning signs:** E2E/manual: сохранение шага редиректит на 404.

### Pitfall 5: Composite unique migration failure

**What goes wrong:** `migrate deploy` падает на duplicate `(subjectId, number)`.
**Why it happens:** Все уровни backfill'ятся в один Subject с number 1..5 — OK; проблема при частичных данных.
**How to avoid:** Перед `CREATE UNIQUE INDEX` проверить дубликаты SQL; на dev — clean seed.
**Warning signs:** Prisma error P2002 при migrate.

### Pitfall 6: Journal/analytics still global

**What goes wrong:** Попытка subject-scope всего `getLevelsForCreateUser` в Phase 10.
**Why it happens:** Смешение границ фаз.
**How to avoid:** **Не трогать** journal, analytics, user-admin level pickers — Phase 11–14.
**Warning signs:** Scope creep в `user-actions.ts`.

## Code Examples

### Prisma Subject + Level (target schema)

```prisma
// Source: [CITED: prisma.io/docs — composite @@unique]
model Subject {
  id          String   @id @default(cuid())
  name        String
  description String   @default("")
  levels      Level[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Level {
  id        String    @id @default(cuid())
  subjectId String
  subject   Subject   @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  number    Int
  title     String
  students  Student[]
  steps     Step[]

  @@unique([subjectId, number])
}
```

### Zod subject validation

```typescript
// Source: UI-SPEC + паттерн validations/level.ts
import { z } from 'zod'

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Название должно быть не короче 2 символов'),
  description: z.string().optional(),
})

export const updateSubjectSchema = createSubjectSchema
```

### Next.js 16 page with subjectId param

```typescript
// Source: [CITED: github.com/vercel/next.js/v16.1.6 — params Promise]
type Props = { params: Promise<{ subjectId: string }> }

export default async function SubjectProgramPage({ params }: Props) {
  await requireRoles(['SUPER_ADMIN', 'MANAGER'])
  const { subjectId } = await params
  const [subject, levels] = await Promise.all([
    getSubject(subjectId),
    getLevels(subjectId),
  ])
  if (!subject) return <Text>Предмет не найден</Text>
  // ...
}
```

### Seed: three subjects

```typescript
// Source: рефакторинг prisma/seed.ts + prisma/lib/seed-program.ts
const quran = await prisma.subject.create({
  data: { name: 'Коран', description: 'Полная программа изучения Корана' },
})
await seedProgram(prisma, { subjectId: quran.id })

const tajweed = await prisma.subject.create({
  data: { name: 'Таджвид', description: 'Правила чтения' },
})
await seedMiniProgram(prisma, { subjectId: tajweed.id, levels: 2, stepsPerLevel: 3 })

const arabic = await prisma.subject.create({
  data: { name: 'Арабский язык', description: 'Базовый курс' },
})
await seedMiniProgram(prisma, { subjectId: arabic.id, levels: 3, stepsPerLevel: 5 })
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global `Level.number @unique` | `@@unique([subjectId, number])` | Phase 10 | Несколько предметов с уровнем 1 |
| `/admin/program` | `/admin/subjects/[id]/program` | Phase 10 | Навигация и revalidatePath |
| `seedProgram()` без subject | `seedProgram(prisma, { subjectId })` | Phase 10 | JSON import только для Корана |
| Global step offsets | Offsets per subjectId | Phase 10 | Номер шага в таблице program editor |

**Deprecated/outdated:**
- Маршруты `src/app/(dashboard)/admin/program/**` — удалить (D-06).
- `getLevels()` без аргументов в program-actions — заменить на `getLevels(subjectId)`.
- `revalidatePath('/admin/program')` — subject-scoped paths.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | На prod миграция backfill'ит все существующие Level в Subject «Коран» без удаления completions | Pitfall 1 | Нужен иной prod rollout |
| A2 | Для D-02 достаточно удаления **пустых** предметов без реализации `deleteLevel` в Phase 10 | Pitfall 3 | UX: нельзя очистить программу предмета |
| A3 | `gen_random_uuid()` в migration SQL заменяется на фиксированный cuid или Prisma-generated id | Pattern 4 | Ошибка SQL на prod Postgres |
| A4 | Студенты в seed продолжают ссылаться на уровни предмета «Коран» (первый subject) | Seed | Seed падает или неверный прогресс в демо |

## Open Questions

1. **Нужен ли `deleteLevel` в Phase 10?**
   - What we know: D-02 требует удалить уровни перед удалением предмета; `deleteLevel` отсутствует.
   - What's unclear: Входит ли delete level в scope или только block delete subject.
   - Recommendation: Добавить минимальный `deleteLevel` (guard: 0 students, cascade steps) в program-admin — иначе D-02 неполноценен.

2. **Создание уровня: модалка vs страница?**
   - What we know: UI-SPEC предпочитает модалку; текущая ссылка `/admin/program/new` битая.
   - Recommendation: Модалка `CreateLevelForm` на `/admin/subjects/[subjectId]/program` по аналогии с `CreateGroupForm`.

3. **Фиксированный id дефолтного Subject в migration?**
   - What we know: backfill требует стабильный id для UPDATE Level.
   - Recommendation: Использовать явный cuid в INSERT migration SQL (как seed-константа).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, migrate, seed | ✓ | 22.15.0 | — |
| pnpm | package manager | ✓ | 9.6.0 | — |
| Prisma CLI | migration | ✓ | 7.8.0 | — |
| PostgreSQL | schema, seed | ✓ (assumed local/docker) | — | `docker compose --profile local-db` |
| Docker | local Postgres | not verified | — | Remote DATABASE_URL |

**Missing dependencies with no fallback:** none for implementation (PostgreSQL required at migrate/seed time).

**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test:unit` |
| Full suite command | `pnpm test:unit` |
| E2E | `pnpm test:e2e` (Playwright 1.61.0) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUBJ-01 | deleteSubject rejects when levels exist | unit | `pnpm test:unit -- src/features/subject-admin/actions/subject-actions.test.ts` | ❌ Wave 0 |
| SUBJ-01 | createSubject validates name min 2 | unit | same | ❌ Wave 0 |
| SUBJ-02 | getLevels returns only subject's levels | unit | `pnpm test:unit -- src/features/program-admin/actions/program-actions.test.ts` | ❌ Wave 0 |
| SUBJ-02 | getLevelSteps rejects wrong subjectId | unit | same | ❌ Wave 0 |
| SUBJ-18 | getLevelStepOffsets scoped by subjectId | unit | `pnpm test:unit -- src/shared/lib/student-progress/offsets.test.ts` | ❌ Wave 0 |
| SUBJ-01–04 | Manager can open /admin/subjects | e2e smoke | `pnpm test:e2e -- e2e/admin-subjects.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test:unit` (targeted file if added)
- **Per wave merge:** `pnpm test:unit`
- **Phase gate:** `pnpm test:unit` green; manual smoke `/admin/subjects` → program → step editor

### Wave 0 Gaps

- [ ] `src/features/subject-admin/actions/subject-actions.test.ts` — delete guard, validation
- [ ] `src/shared/lib/student-progress/offsets.test.ts` — subject-scoped offsets
- [ ] `e2e/admin-subjects.spec.ts` — optional smoke (нет текущих e2e на `/admin/program` [VERIFIED: e2e grep])

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth JWT; existing session |
| V3 Session Management | no change | JWT strategy unchanged |
| V4 Access Control | yes | `requireRoles(['MANAGER','SUPER_ADMIN'])` on pages + actions |
| V5 Input Validation | yes | Zod `createSubjectSchema`, `createLevelSchema` + subjectId |
| V6 Cryptography | no | — |

### Known Threat Patterns for stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR: access another subject's program via levelId | Elevation | `findFirst({ where: { id: levelId, subjectId } })` |
| Unauthorized admin access | Spoofing | middleware `/admin` + requireRoles |
| Mass assignment on subject fields | Tampering | Zod whitelist (name, description only) |
| SQL injection | Tampering | Prisma parameterized queries |

## Sources

### Primary (HIGH confidence)
- `/websites/prisma_io` — composite `@@unique`, migration constraints
- `/vercel/next.js/v16.1.6` — params as Promise in App Router
- Codebase: `prisma/schema.prisma`, `program-actions.ts`, `groups/`, `seed-program.ts`, `10-CONTEXT.md`, `10-UI-SPEC.md`

### Secondary (MEDIUM confidence)
- `.cursor/rules/prisma-migrations.mdc` — prod-safe migration workflow
- `prisma/migrations/20260606120000_move_level_to_student/migration.sql` — backfill pattern precedent

### Tertiary (LOW confidence)
- —

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; verified versions in package.json
- Architecture: HIGH — patterns directly copied from existing features
- Pitfalls: MEDIUM — delete level scope unresolved (A2)

**Research date:** 2026-07-07
**Valid until:** 2026-08-07 (stable brownfield patterns)
