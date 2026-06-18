# Электронный дневник медресе

Веб-приложение для ведения журнала посещаемости и успеваемости учеников по программе изучения Корана.

## Стек

- Next.js 16 (App Router), TypeScript
- PostgreSQL (Neon) + Prisma 7
- NextAuth v5 — авторизация по 6-значному коду
- Ant Design, Tailwind CSS
- React Query, Zustand, React Hook Form, Zod
- Tiptap — редактор шагов программы
- Recharts — аналитика

## Быстрый старт

```bash
pnpm install
cp .env.example .env   # заполнить DATABASE_URL и AUTH_SECRET
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Тестовые коды (после seed)

| Роль | Код |
|------|-----|
| SUPER_ADMIN | 100001 |
| MANAGER | 100002 |
| TEACHER | 200001, 200002 |
| STUDENT | 300001–300005 |

## Роуты

| Путь | Роли |
|------|------|
| `/login` | все (вход) |
| `/journal` | TEACHER |
| `/groups` | TEACHER, MANAGER, SUPER_ADMIN |
| `/analytics` | TEACHER, MANAGER, SUPER_ADMIN |
| `/student/me` | STUDENT |
| `/admin/users` | MANAGER, SUPER_ADMIN |
| `/admin/program` | MANAGER, SUPER_ADMIN |
| `/admin/groups` | MANAGER, SUPER_ADMIN |
| `/admin/awards` | MANAGER, SUPER_ADMIN |

## Структура (FSD)

```
src/
├── app/           # роуты Next.js
├── entities/      # доменные сущности
├── features/      # фичи (journal, auth, program-admin…)
├── widgets/       # app-shell
└── shared/        # lib, ui, providers
```

## Скрипты

- `pnpm dev` — разработка
- `pnpm build` — production-сборка
- `pnpm db:migrate` — миграции
- `pnpm db:seed` — демо-данные
- `pnpm db:studio` — Prisma Studio
- `pnpm test:e2e` — e2e-тесты (Playwright)
- `pnpm test:e2e:ui` — e2e в интерактивном режиме

## E2E-тесты (Playwright)

Используется отдельный файл **`.env.test`** (не `.env`!) — желательно с отдельной тестовой БД.

```bash
cp .env.test.example .env.test   # заполнить DATABASE_URL и AUTH_SECRET
pnpm exec playwright install chromium
pnpm test:e2e
```

Перед тестами автоматически выполняется `pnpm db:seed`. Пропуск seed: `E2E_SKIP_SEED=1 pnpm test:e2e`.
