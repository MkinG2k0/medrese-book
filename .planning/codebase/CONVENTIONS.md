# Coding Conventions

**Analysis Date:** 2026-06-24

## Naming Patterns

**Files:**
- React-компоненты: `PascalCase.tsx` — `src/features/auth/ui/LoginForm.tsx`, `src/features/journal/ui/StudentList.tsx`
- Server Actions: `*-actions.ts` в `actions/` — `src/features/journal/actions/journal-actions.ts`, `src/features/user-admin/actions/user-actions.ts`
- Хуки React Query: `use-*.ts` в `entities/*/api/` — `src/entities/student/api/use-students.ts`, `src/entities/session/api/use-sessions.ts`
- Кастомные хуки фич: `use-*.ts` в `model/` — `src/features/journal/model/use-lesson-page.ts`
- Утилиты и бизнес-логика: `kebab-case.ts` — `src/shared/lib/calendar-date.ts`, `src/features/journal/lib/lesson-step-states.ts`
- Zod-схемы: по домену в `src/shared/lib/validations/` — `user.ts`, `session.ts`, `step-completion.ts`
- API-роуты: `route.ts` в `src/app/api/<resource>/`
- Страницы App Router: `page.tsx`, `layout.tsx` в `src/app/`

**Functions:**
- Экспортируемые функции: `camelCase` — `getTeacherGroup`, `loginWithCode`, `authorizeTeacherStudent`
- Server Actions именуются по действию: `createUsers`, `getStudentLesson`, `updateStudentProgress`
- Хуки: префикс `use` — `useStudents`, `useJournalStore`, `useLessonPage`
- Селекторы Zustand: `select*` — `selectSessionStepStates` в `src/features/journal/model/journal-store.ts`
- Хелперы валидации/парсинга: глагол + сущность — `parseStudentEntries`, `buildCreateUsersPayload` в `src/shared/lib/validations/user.ts`

**Variables:**
- `camelCase` для переменных и параметров
- `SCREAMING_SNAKE_CASE` для констант верхнего уровня — `EMPTY_SESSION_COMPLETIONS`, `INITIAL_VISIBLE_STEPS`, `PASSING_GRADE` в `prisma/seed.ts`
- Prisma enum-значения: `SCREAMING_SNAKE_CASE` — `'TEACHER'`, `'PRESENT'`, `'LATE'`, `'ABSENT'`
- Тестовые константы: `TEST_CODES`, `TEST_USERS` в `e2e/helpers/codes.ts`

**Types:**
- Экспортируемые типы: `PascalCase` — `JournalStep`, `LoginResult`, `CreateSessionInput`, `StepGradeState`
- Props-компонентов: `ComponentNameProps` — `RoleGuardProps` в `src/shared/ui/RoleGuard.tsx`
- Zod-типы через `z.infer<typeof schema>` — `CreateUsersInput`, `UpdateStudentUserFormInput`
- Доменные типы сущностей: `src/entities/*/model/types.ts`, реэкспорт через `src/entities/user/index.ts`

## Code Style

**Formatting:**
- Prettier не настроен (файлов `.prettierrc`, `biome.json` нет)
- Два устойчивых стиля в кодовой базе:
  - **Табы, одинарные кавычки, без точек с запятой** — server actions, страницы, validations, entities hooks: `src/features/journal/actions/journal-actions.ts`, `src/shared/lib/validations/user.ts`, `src/app/(dashboard)/journal/page.tsx`
  - **2 пробела, двойные кавычки, с точками с запятой** — client components, API routes, e2e: `src/features/auth/ui/LoginForm.tsx`, `src/app/api/step-completions/route.ts`, `e2e/auth.spec.ts`
- При добавлении кода **следуй стилю соседних файлов в той же папке/слое**, не смешивай стили в одном файле

**Linting:**
- ESLint 9 flat config: `eslint.config.mjs`
- Базовые правила: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- TypeScript: `strict: true` в `tsconfig.json`
- Path alias: `@/*` → `./src/*`

**Архитектурные ограничения импортов (ESLint `no-restricted-imports`):**
- `src/shared/**` — нельзя импортировать из `@/features/*`, `@/widgets/*`
- `src/entities/**` — нельзя импортировать из `@/features/*`, `@/widgets/*`
- `src/features/**` — нельзя импортировать из `@/widgets/*`
- `src/app/**` — исключён из layer-ограничений (может импортировать всё)

## Import Organization

**Order:**
1. Директива `'use server'` или `"use client"` (если нужна)
2. Внешние пакеты (`next/*`, `react`, `antd`, `@tanstack/*`, `zod`)
3. Алиасы `@/features/*`, `@/entities/*`, `@/shared/*`, `@/widgets/*`
4. Относительные импорты (`./`, `../`) — в основном внутри фичи

**Path Aliases:**
- `@/*` → `src/*` — единственный алиас, настроен в `tsconfig.json`

**Пример server action:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/shared/lib/prisma'
import { requireRoles } from '@/shared/lib/session'
import { createUsersSchema } from '@/shared/lib/validations/user'
```

**Пример client component:**
```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "antd";
import { useForm } from "react-hook-form";

import { loginWithCode } from "@/features/auth/actions/login-actions";
import Text from "@/shared/ui/Text";
```

## Error Handling

**API Routes (`src/app/api/**/route.ts`):**
- Используй хелперы из `src/shared/api/index.ts`: `success`, `created`, `error`, `unauthorized`, `forbidden`, `notFound`, `serverError`
- Формат ответа: `{ data: T | null, error: string | null }`
- Валидация входа: `schema.safeParse(body)` → `error(parsed.error.message)` при неудаче
- Авторизация: `auth()` → ранний return `unauthorized()` / `forbidden()`
- Бизнес-ошибки: `error("сообщение на русском", status?)`
- Неожиданные ошибки БД: `try/catch` → `serverError(err)`

```typescript
const parsed = createSessionSchema.safeParse(body);
if (!parsed.success) return error(parsed.error.message);

const session = await auth();
if (!session) return unauthorized();
if (session.user.role !== "TEACHER") return forbidden();
```

**Server Actions (`src/features/*/actions/*-actions.ts`):**
- Авторизация в начале: `await requireRole('TEACHER')` или `await requireRoles(['SUPER_ADMIN', 'MANAGER'])` из `src/shared/lib/session.ts`
- Валидация: `schema.parse(input)` (бросает) или `safeParse` с возвратом результата
- Бизнес-ошибки: `throw new Error('сообщение на русском')` — `src/features/user-admin/actions/user-actions.ts`
- После мутаций: `revalidatePath('/journal')`, `revalidatePath(\`/journal/${studentId}\`)` — см. `src/app/api/sessions/route.ts`, `src/features/student-admin/actions/student-admin-actions.ts`

**Server Actions с Result-типом (для форм):**
- Паттерн `{ ok: true } | { ok: false; error: string }` — `LoginResult` в `src/features/auth/actions/login-actions.ts`
- Клиент проверяет `result.ok` и показывает `result.error` в UI

**Страницы (Server Components):**
- `await requireRole('TEACHER')` — редирект на `/login` при отсутствии сессии или неверной роли
- Пустые состояния: ранний return JSX с `<Text>` — `src/app/(dashboard)/journal/page.tsx`

**Авторизация доступа к ресурсам:**
- API: `authorizeTeacherStudent(studentId)` из `src/shared/lib/authorize-student.ts` — возвращает `{ error, student }`
- Проверяй `authResult.error` и делай ранний return

**Клиент (React Query):**
- В `queryFn`/`mutationFn`: `if (json.error) throw new Error(json.error)` — `src/entities/student/api/use-students.ts`
- Ошибки отображаются через Ant Design `message.error` или локальный `useState` — `src/features/journal/model/use-lesson-page.ts`, `src/features/auth/ui/LoginForm.tsx`

## Logging

**Framework:** `console` (минимальное использование)

**Patterns:**
- `console.error("[API Error]", err)` только в `serverError()` и только при `NODE_ENV === "development"` — `src/shared/api/index.ts`
- E2E setup: `console.log` для статуса seed — `e2e/global-setup.ts`
- Не добавляй `console.log` в production-код без необходимости

## Comments

**When to Comment:**
- JSDoc для неочевидных хелперов E2E — `e2e/helpers/antd.ts` (`/** Клик по Ant Design Radio.Button... */`)
- Комментарии в ESLint config для объяснения layer rules — `eslint.config.mjs`
- Бизнес-логика должна быть самодокументируемой; inline-комментарии редки

**JSDoc/TSDoc:**
- Не используется систематически
- Типы экспортируются через `export type` вместо JSDoc

## Function Design

**Size:** Функции в server actions и хуках могут быть длинными (100+ строк) — `src/features/journal/model/use-lesson-page.ts`, `src/features/user-admin/actions/user-actions.ts`. Выноси повторяющуюся логику в `lib/` внутри фичи или `src/shared/lib/`.

**Parameters:**
- Server actions принимают `unknown` для внешнего ввода, затем парсят через Zod — `createUsers(input: unknown)`
- Типизированные параметры для внутренних вызовов — `getStudentLesson(studentId: string)`

**Return Values:**
- Server actions: данные Prisma напрямую, `null` при отсутствии/запрете доступа, или Result-объект
- API routes: всегда `NextResponse` через хелперы `success`/`error`
- Хуки React Query: типизированный generic `useQuery<Student[]>`

## Module Design

**Exports:**
- Публичный API фичи через barrel `index.ts` — `src/features/theme-settings/index.ts`
- Shared barrel частичный — `src/shared/lib/index.ts` (только utils, site, useDebounce)
- Компоненты: именованный export `export function LoginForm()` или default re-export antd — `src/shared/ui/Title.tsx`

**Barrel Files:**
- Используются в `entities/*/index.ts` и `features/*/index.ts` для типов и публичных компонентов
- Не создавай глубокие barrel-цепочки; импортируй напрямую из `actions/`, `ui/`, `lib/` при работе внутри фичи

## Validation (Zod)

**Расположение:** `src/shared/lib/validations/<domain>.ts`

**Patterns:**
- Отдельные схемы для формы и API payload при разной структуре — `createUserFormSchema` + `createUsersSchema` + `buildCreateUsersPayload()` в `src/shared/lib/validations/user.ts`
- Сообщения об ошибках на русском: `z.string().min(2, 'Имя должно быть не короче 2 символов')`
- `.refine()` для кросс-полевой валидации (роль STUDENT → обязательны groupId, levelId)
- `z.infer<typeof schema>` для экспорта типов
- В server actions: `.parse()` для trusted internal calls; `.safeParse()` для user input в API и login

## UI Patterns

**Component library:** Ant Design (`antd`, `@ant-design/icons`)

**Forms:**
- `react-hook-form` + `@hookform/resolvers/zod` + `zodResolver(schema)`
- Ant Design inputs через `Controller` — `src/features/auth/ui/LoginForm.tsx`
- Локальный state для ошибок submit: `useState<string | null>(null)`

**Styling:**
- Tailwind CSS через `cn()` из `src/shared/lib/utils.ts` (`clsx` + `tailwind-merge`)
- Ant Design theme через `src/shared/providers/antd-provider.tsx`

**Shared UI:**
- Тонкие обёртки над antd: `src/shared/ui/Title.tsx`, `src/shared/ui/Text.tsx`
- `RoleGuard` для условного рендера по роли — `src/shared/ui/RoleGuard.tsx`

## State Management

**Server state:** TanStack React Query
- `queryKey`: массив строк — `['students', groupId, date]`, `['student-session', studentId, date]`
- `enabled` для условной загрузки
- `invalidateQueries` в `onSuccess` мутаций — `src/entities/session/api/use-sessions.ts`

**Client UI state:** Zustand
- `create<StoreType>()` с селекторами — `src/features/journal/model/journal-store.ts`
- Экспортируй константы пустого состояния: `EMPTY_SESSION_COMPLETIONS`

## Server/Client Boundaries

**Server Actions:** `'use server'` в начале файла `actions/*-actions.ts`

**Client Components:** `"use client"` в начале файла с хуками, состоянием, браузерными API

**Pages:** Server Components по умолчанию; вызывают `requireRole` и передают данные в client UI

## Localization

**UI strings:** Русский язык во всех пользовательских сообщениях, заголовках, ошибках валидации

**Formatting:** `Intl` с локалью `ru-RU` — `formatDate`, `formatPrice`, `formatPhone` в `src/shared/lib/utils.ts`

---

*Convention analysis: 2026-06-24*
