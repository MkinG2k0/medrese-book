# Электронный дневник медресе

Веб-приложение для медресе: журнал посещаемости и успеваемости учеников по программе изучения Корана. Учителя проводят уроки и выставляют оценки, менеджеры управляют программой и персоналом, ученики видят свой прогресс.

Production: [toykhana.ru](https://toykhana.ru)

## Возможности

- **Журнал** — посещаемость, оценки по шагам программы, заметки к уроку
- **Программа** — 5 уровней (555 шагов), редактор шагов с арабским текстом (Tiptap)
- **Аналитика** — прогресс учеников, отстающие, статистика по уровням и учителям
- **Группы и ученики** — привязка к учителю, уровню, статусы (активен, пауза)
- **Замещения и отпуска** — календарь отпусков, замена преподавателя
- **Сообщения** — чат между ролями
- **Уведомления** — in-app и Web Push (VAPID)
- **Награды** — выдача и просмотр учениками
- **PWA** — установка на устройство, офлайн-оболочка

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Ant Design 6, Tailwind CSS 4 |
| Backend | Server Actions, API Routes, NextAuth v5 (JWT, вход по 6-значному коду) |
| БД | PostgreSQL, Prisma 7 (`@prisma/adapter-pg`) |
| Состояние | React Query, Zustand (черновик журнала) |
| Формы / валидация | React Hook Form, Zod 4 |
| Тесты | Vitest (unit), Playwright (e2e) |

Архитектура — [Feature-Sliced Design](https://feature-sliced.design/): `src/app`, `entities`, `features`, `widgets`, `shared`.

## Требования

- **Node.js** ≥ 22.12
- **pnpm** 9 (рекомендуется; lockfile в репозитории)
- **PostgreSQL** — Neon, managed Postgres или локально через Docker

## Быстрый старт

```bash
pnpm install
```

Создайте `.env` в корне проекта:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
AUTH_SECRET="длинный-случайный-секрет"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Опционально:

```env
SITE_URL="https://toykhana.ru"
SUPER_ADMIN_CODE="123456"
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
```

Далее:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Приложение: [http://localhost:3000](http://localhost:3000)

### Локальная PostgreSQL (Docker)

```bash
docker compose --profile local-db up -d postgres
```

Параметры по умолчанию: `postgresql://wedding:wedding@localhost:5432/toykhana`

## Программа обучения

Шаги уровней хранятся в `prisma/data/` как JSON и загружаются в БД через `pnpm db:seed`.

| Уровень | Файлы | Шагов |
|---------|-------|-------|
| 1 | `level1-page1..3.json` | 33 |
| 2 | `level2.json` | 168 |
| 3 | `level3-page1..6.json` | 159 |
| 4 | `level4-page1..6.json` | 158 |
| 5 | `level5-page1..2.json` | 37 |

```bash
pnpm db:seed               # загрузить уровни и демо-данные в БД
```

## Команды

### Разработка

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Dev-сервер Next.js ([localhost:3000](http://localhost:3000)) |
| `pnpm build` | Production-сборка |
| `pnpm start` | Запуск собранного приложения |
| `pnpm lint` | ESLint (в т.ч. правила FSD-слоёв) |

`postinstall` автоматически выполняет `prisma generate`.

### База данных

| Команда | Описание |
|---------|----------|
| `pnpm db:generate` | Сгенерировать Prisma Client (`generated/prisma/`) |
| `pnpm db:migrate` | Применить миграции в dev (`prisma migrate dev`) |
| `pnpm db:push` | Синхронизировать схему без миграции (`db push`) |
| `pnpm db:studio` | Prisma Studio — GUI для БД |
| `pnpm db:seed` | Полный демо-seed: 5 уровней, группы, 22 ученика, история занятий |
| `pnpm db:seed:prod` | Production-seed: программа + супер-админ (код из `SUPER_ADMIN_CODE`) |
| `pnpm db:seed:program` | Загрузить программу (5 уровней) из `prisma/data/` в БД |
| `pnpm db:seed:e2e` | Минимальный seed для e2e (2 уровня × 5 шагов, 5 учеников) |
| `pnpm db:bench` | Бенчмарк запросов аналитики к БД |

**Защита seed на production:** `pnpm db:seed` и `pnpm db:seed:e2e` **удаляют все данные** и заблокированы, если `NODE_ENV=production` / `APP_ENV=production`, либо `DATABASE_URL` совпадает с `PRODUCTION_DATABASE_URL`. На prod используйте только `pnpm db:seed:prod` или `pnpm db:seed:program` (идемпотентные).

### Тесты

| Команда | Описание |
|---------|----------|
| `pnpm test:unit` | Unit-тесты (Vitest) |
| `pnpm test:e2e` | E2E-тесты (Playwright) |
| `pnpm test:e2e:ui` | E2E в интерактивном UI Playwright |
| `pnpm test:e2e:report` | Открыть HTML-отчёт последнего прогона |

### Docker

```bash
# Локальная БД
docker compose --profile local-db up -d postgres

# Миграции (отдельный образ)
docker compose --profile migrate run --rm db-migrate

# Приложение (после docker build)
docker compose up app
```

## Переменные окружения

| Переменная | Обязательна | Назначение |
|------------|-------------|------------|
| `DATABASE_URL` | да | Строка подключения PostgreSQL |
| `PRODUCTION_DATABASE_URL` | рекомендуется на prod | Маркер prod-БД: блокирует demo/e2e seed при совпадении с `DATABASE_URL` |
| `SEED_BLOCKED_DB_HOSTS` | нет | Доп. хосты БД через запятую, на которых запрещён demo/e2e seed |
| `ALLOW_DESTRUCTIVE_SEED` | нет | `1` — явный override только вне `NODE_ENV=production` |
| `AUTH_SECRET` или `NEXTAUTH_SECRET` | да | Секрет JWT NextAuth |
| `AUTH_URL` / `NEXTAUTH_URL` | да (prod) | Базовый URL приложения |
| `SUPER_ADMIN_CODE` | для `db:seed:prod` | 6-значный код супер-админа |
| `SITE_URL` | нет | Канонический URL (robots, sitemap) |
| `VAPID_*` | для push | Ключи Web Push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | для push в браузере | Публичный VAPID-ключ |

Для e2e — отдельный файл `.env.test` (см. `.env.test.example`), **не** коммитить.

## Тестовые коды (после `pnpm db:seed`)

| Роль | Код |
|------|-----|
| SUPER_ADMIN | `100001` |
| MANAGER | `100002` |
| TEACHER | `200001`, `200002` |
| STUDENT | `300001`–`300022` (22 ученика на уровнях 1–5) |

Для e2e после `db:seed:e2e`: ученики `300001`–`300005`.

## Маршруты

| Путь | Роли | Назначение |
|------|------|------------|
| `/login` | все | Вход по коду |
| `/dashboard` | авторизованные | Главная |
| `/journal` | TEACHER | Список учеников, журнал |
| `/journal/[studentId]` | TEACHER | Урок ученика |
| `/journal/history` | TEACHER | История шагов |
| `/my-group` | TEACHER | Моя группа |
| `/calendar` | TEACHER | Календарь занятий |
| `/messages` | TEACHER, MANAGER, STUDENT | Сообщения |
| `/groups` | MANAGER, SUPER_ADMIN | Список групп |
| `/groups/[groupId]` | MANAGER, SUPER_ADMIN | Карточка группы |
| `/analytics` | TEACHER, MANAGER, SUPER_ADMIN | Аналитика учеников |
| `/analytics/teachers` | MANAGER, SUPER_ADMIN | Аналитика учителей |
| `/admin/users` | MANAGER, SUPER_ADMIN | Пользователи |
| `/admin/program` | MANAGER, SUPER_ADMIN | Уровни программы |
| `/admin/program/[levelId]/steps/...` | MANAGER, SUPER_ADMIN | Редактор шагов |
| `/admin/awards` | MANAGER, SUPER_ADMIN | Награды |
| `/admin/leave-calendar` | MANAGER, SUPER_ADMIN | Календарь отпусков |
| `/student/me` | STUDENT | Мой прогресс |
| `/student/lessons` | STUDENT | Уроки |
| `/student/history` | STUDENT | История занятий |
| `/student/awards` | STUDENT | Награды |

## Структура проекта

```
medrese-book/
├── prisma/
│   ├── schema.prisma      # схема БД
│   ├── migrations/        # миграции
│   ├── data/              # JSON программы (уровни 1–5)
│   ├── seed.ts            # демо-seed
│   ├── seed-prod.ts       # production-seed
│   ├── seed-program.ts    # загрузка программы в БД
│   ├── seed-e2e.ts        # e2e-seed
├── src/
│   ├── app/               # Next.js App Router, API routes
│   ├── entities/          # типы и React Query-хуки
│   ├── features/          # journal, auth, program-admin, analytics…
│   ├── widgets/           # AppShell (навигация)
│   └── shared/            # lib, ui, providers, validations
├── e2e/                   # Playwright-тесты
├── generated/prisma/      # Prisma Client (после generate)
└── docker-compose.yml
```

## E2E-тесты

Используется **отдельная** тестовая БД (файл `.env.test`):

```bash
cp .env.test.example .env.test
# заполнить DATABASE_URL и AUTH_SECRET

pnpm exec playwright install chromium
pnpm test:e2e
```

Перед прогоном автоматически выполняется seed. Пропуск: `E2E_SKIP_SEED=1 pnpm test:e2e`.

Порт dev-сервера для тестов: `PLAYWRIGHT_PORT` (по умолчанию `3005`).

## Роли

| Роль | Доступ |
|------|--------|
| `SUPER_ADMIN` | Полный доступ, управление менеджерами |
| `MANAGER` | Группы, программа, пользователи, аналитика, отпуска |
| `TEACHER` | Журнал своих групп, календарь, аналитика |
| `STUDENT` | Свой прогресс, уроки, награды, сообщения |

Супер-админ не отображается в переключателе пользователей в UI.

## Лицензия

Приватный проект (`private: true`).
