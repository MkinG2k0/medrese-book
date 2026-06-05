# Моя свадьба — Платформа бронирования банкетных залов

Платформа поиска и бронирования банкетных залов для свадеб и мероприятий в Махачкале и Дагестане.

## Технологический стек

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, NextAuth.js v5 (SMS OTP)
- **База данных:** PostgreSQL 15+, Prisma ORM
- **Сервисы:** Yandex Object Storage (S3), SMS.ru, Telegram Bot API

## Быстрый старт

### Требования

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Установка

```bash
pnpm install
```

### База данных

```bash
# Создать переменные окружения
cp .env.example .env
# Отредактируйте .env — укажите DATABASE_URL и другие ключи

# Применить миграции
pnpm db:migrate

# Заполнить тестовыми данными (опционально)
pnpm db:seed
```

### Запуск в режиме разработки

```bash
pnpm dev
```

Приложение доступно по адресу [http://localhost:3000](http://localhost:3000).

## Развёртывание в Docker

### Сборка и запуск

```bash
docker compose up -d
```

Сервисы:

- **Приложение:** http://localhost:3000
- **PostgreSQL:** порт 5432 (внутренняя сеть)

### Переменные окружения

Создайте файл `.env` в корне проекта. Для Docker убедитесь, что `DATABASE_URL` указывает на контейнер postgres или переопределяется в `docker-compose.yml`:

```env
DATABASE_URL=postgresql://toykhana:toykhana_secret@postgres:5432/toykhana
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
# ... остальные переменные из .env.example
```

### Сборка образа

```bash
docker compose build
```

## Переменные окружения

| Переменная              | Описание                          |
|-------------------------|-----------------------------------|
| `DATABASE_URL`          | Строка подключения к PostgreSQL  |
| `NEXTAUTH_URL`          | URL приложения (для ссылок, sitemap) |
| `NEXTAUTH_SECRET`       | Секрет для сессий NextAuth       |
| `SMS_RU_API_KEY`        | API-ключ SMS.ru                  |
| `S3_ENDPOINT`           | Endpoint Yandex Object Storage   |
| `S3_BUCKET`             | Имя S3-бакета                    |
| `S3_ACCESS_KEY`         | Ключ доступа S3                  |
| `S3_SECRET_KEY`         | Секретный ключ S3                |
| `TELEGRAM_BOT_TOKEN`    | Токен Telegram-бота              |
| `NEXT_PUBLIC_YANDEX_MAPS_KEY` | Ключ Яндекс.Карт          |

Полный список — см. `.env.example`.

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Логин, регистрация
│   ├── api/                # API-маршруты
│   ├── booking/            # Форма бронирования
│   ├── dashboard/          # Личный кабинет владельца
│   ├── venues/             # Каталог и страницы залов
│   ├── sitemap.ts          # Динамическая карта сайта
│   └── robots.ts           # robots.txt для SEO
├── components/             # React-компоненты
│   ├── ui/                 # shadcn/ui
│   ├── layout/             # header, footer, sidebar
│   ├── venues/             # карточки, галереи, фильтры
│   └── booking/            # форма и статусы бронирования
├── hooks/                  # React-хуки и TanStack Query
├── lib/                    # prisma, auth, s3, sms, telegram
├── types/                  # TypeScript-типы
├── validators/             # Zod-схемы
└── providers/              # Query, Auth, Theme
```

## SEO

- **Sitemap:** `/sitemap.xml` — динамическая карта с главной, каталогом и страницами залов
- **Robots:** `/robots.txt` — запрет индексации `/dashboard/`, `/api/`, `/booking/`

## Скрипты

| Команда         | Описание                    |
|-----------------|-----------------------------|
| `pnpm dev`      | Запуск в режиме разработки  |
| `pnpm build`    | Сборка для production       |
| `pnpm start`    | Запуск production-сервера   |
| `pnpm db:generate` | Генерация Prisma Client  |
| `pnpm db:migrate`  | Применение миграций      |
| `pnpm db:seed`     | Заполнение тестовыми данными |
| `pnpm db:studio`   | Prisma Studio (GUI)       |

## Лицензия

Приватный проект.
