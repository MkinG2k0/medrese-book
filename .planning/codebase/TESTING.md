# Testing Patterns

**Analysis Date:** 2026-06-24

## Test Framework

**Runner:**
- Playwright `@playwright/test` ^1.61.0
- Config: `playwright.config.ts`

**Assertion Library:**
- Встроенные `expect` из `@playwright/test`

**Unit/Integration Runner:**
- Не обнаружен (нет Vitest, Jest, `@testing-library/*`)

**Run Commands:**
```bash
pnpm test:e2e              # Запуск всех e2e-тестов
pnpm test:e2e:ui           # Интерактивный UI-режим Playwright
pnpm test:e2e:report       # Просмотр HTML-отчёта после прогона
pnpm exec playwright install chromium   # Установка браузера (первый раз)
```

## Test File Organization

**Location:**
- E2E-тесты в корневой папке `e2e/` (не co-located с исходниками)
- Хелперы в `e2e/helpers/`

**Naming:**
- Спеки: `<domain>.spec.ts` — `auth.spec.ts`, `journal.spec.ts`, `admin.spec.ts`, `student.spec.ts`, `navigation.spec.ts`
- Хелперы: `<purpose>.ts` — `auth.ts`, `antd.ts`, `codes.ts`, `load-test-env.ts`
- Global setup: `e2e/global-setup.ts`

**Structure:**
```
e2e/
├── admin.spec.ts
├── auth.spec.ts
├── journal.spec.ts
├── navigation.spec.ts
├── student.spec.ts
├── global-setup.ts
└── helpers/
    ├── antd.ts
    ├── auth.ts
    ├── codes.ts
    └── load-test-env.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";

test.describe("Журнал учителя", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await expect(page).toHaveURL(/\/journal/);
  });

  test("отображает учеников группы Аль-Фатиха", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Журнал на сегодня" })).toBeVisible();
    await expect(page.getByRole("link", { name: TEST_USERS.studentAli })).toBeVisible();
  });
});
```

**Patterns:**
- **Setup:** `test.beforeEach` с `loginAs()` для ролевых сценариев — `e2e/journal.spec.ts`, `e2e/admin.spec.ts`
- **Описания:** Русские строки в `test.describe()` и `test("...")` — отражают пользовательское поведение
- **Группировка:** По домену и роли — «Авторизация», «Журнал учителя», «Админ-панель менеджера», «Навигация по ролям»
- **Assertions:** Accessibility-first селекторы — `getByRole`, `getByPlaceholder`, `getByText`; regex для гибких совпадений URL и имён
- **Teardown:** Явный teardown не используется; состояние сбрасывается через `global-setup` (seed БД)

## Playwright Configuration

**Ключевые настройки (`playwright.config.ts`):**
- `testDir: "./e2e"`
- `fullyParallel: false`, `workers: 1` — последовательный прогон (общая БД)
- `retries: process.env.CI ? 2 : 0`
- `timeout: 10_000`, `expect.timeout: 10_000`
- `locale: "ru-RU"`
- `trace: "on-first-retry"`, `screenshot: "only-on-failure"`, `video: "retain-on-failure"`
- `projects: [{ name: "chromium" }]` — только Desktop Chrome
- `globalSetup: "./e2e/global-setup.ts"`
- `webServer`: `pnpm dev` на порту `PLAYWRIGHT_PORT` (default `3001`)

**Переменные окружения для тестов:**
- Файл `.env.test` (обязателен) — шаблон: `.env.test.example`
- `DATABASE_URL` — отдельная тестовая PostgreSQL БД
- `AUTH_SECRET` (или `NEXTAUTH_SECRET`)
- `PLAYWRIGHT_PORT`, `PLAYWRIGHT_BASE_URL` (опционально)
- `E2E_SKIP_SEED=1` — пропуск seed в global setup

## Global Setup & Database

**Паттерн (`e2e/global-setup.ts`):**
1. `loadTestEnv()` — загрузка `.env.test` через `dotenv`
2. Проверка `DATABASE_URL`
3. `pnpm db:seed` (до 3 попыток с паузой 2с)
4. Пропуск при `E2E_SKIP_SEED=1`

**Тестовые данные:**
- Seed-скрипт: `prisma/seed.ts` — демо-пользователи, группы, уровни, занятия
- Коды доступа зафиксированы в `e2e/helpers/codes.ts` и синхронизированы с seed/README

```typescript
export const TEST_CODES = {
  superAdmin: "100001",
  manager: "100002",
  teacher1: "200001",
  teacher2: "200002",
  studentAli: "300001",
  // ...
} as const;
```

## Test Helpers

**Авторизация (`e2e/helpers/auth.ts`):**
```typescript
export async function loginAs(page: Page, code: string) {
  await page.goto("/login");
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !/\/login$/.test(url.pathname), { waitUntil: "commit" });
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login/);
}
```

**Ant Design (`e2e/helpers/antd.ts`):**
```typescript
/** Клик по Ant Design Radio.Button — скрытый input не кликабелен напрямую. */
export function clickRadioButton(scope: Page | Locator, label: string) {
  return scope
    .locator(".ant-radio-button-wrapper")
    .filter({ hasText: label })
    .click();
}
```

**Загрузка env (`e2e/helpers/load-test-env.ts`):**
- `loadTestEnv()` — читает `.env.test`, бросает ошибку если файл отсутствует
- Вызывается в `playwright.config.ts` и `global-setup.ts`

## Mocking

**Framework:** Не используется (нет unit-тестов с моками)

**E2E-подход:**
- Реальное приложение (`pnpm dev`) + реальная PostgreSQL
- Без моков API; взаимодействие через UI и сетевые запросы
- Ожидание ответа API при необходимости:
```typescript
await Promise.all([
  page.waitForResponse(
    (response) =>
      response.url().includes("/api/sessions") &&
      response.request().method() === "POST" &&
      response.ok(),
  ),
  saveAndNext.click(),
]);
```

**What to Mock:**
- Не применимо для текущего набора тестов

**What NOT to Mock:**
- БД, NextAuth, API routes — всё интеграционно через Playwright

## Fixtures and Factories

**Test Data:**
- Статические константы в `e2e/helpers/codes.ts` — `TEST_CODES`, `TEST_USERS`
- Динамические данные для уникальности: `` `Ученик E2E ${Date.now()}` `` в `e2e/admin.spec.ts`

**Location:**
- `e2e/helpers/codes.ts` — единственный источник тестовых идентификаторов
- Данные БД — `prisma/seed.ts`

## Coverage

**Requirements:** Не настроено (нет coverage-инструментов)

**View Coverage:**
```bash
# Не применимо — unit/integration coverage отсутствует
```

## Test Types

**Unit Tests:**
- Не используются
- Бизнес-логика в `src/shared/lib/` и `src/features/*/lib/` не покрыта unit-тестами

**Integration Tests:**
- Не используются отдельно; интеграция проверяется через E2E

**E2E Tests:**
- Playwright, полный стек (Next.js + PostgreSQL + NextAuth)
- Покрытые области:
  - `e2e/auth.spec.ts` — вход/выход, редиректы, неверный код
  - `e2e/journal.spec.ts` — журнал, урок, оценки, посещаемость, «Сохранить и перейти»
  - `e2e/admin.spec.ts` — пользователи, фильтры, создание ученика, программа, награды, сброс кода
  - `e2e/student.spec.ts` — личный кабинет, история, запрет доступа к журналу
  - `e2e/navigation.spec.ts` — меню по ролям, группы, аналитика

## Common Patterns

**Async Testing:**
```typescript
test("сохраняет урок с оценкой и возвращает в журнал", async ({ page }) => {
  await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
  await clickRadioButton(page, "Хорошо");
  await page.getByRole("button", { name: "Сохранить урок" }).click();
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByText("Урок сохранён")).toBeVisible();
});
```

**Error Testing:**
```typescript
test("неверный код показывает ошибку", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("000000").fill("999999");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("Неверный код доступа")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
```

**Role-based access:**
```typescript
test("неавторизованный пользователь перенаправляется на вход", async ({ page }) => {
  await page.goto("/journal");
  await expect(page).toHaveURL(/\/login/);
});
```

**Ant Design tables/filters:**
- Фильтры через `.ant-table-filter-trigger` и `.ant-table-filter-dropdown`
- Select через `.ant-select[name="groupId"]` + `getByTitle()`
- Modal через `getByRole("dialog")`

**Уникальные данные в тестах:**
- `Date.now()` в имени для создания пользователя без коллизий — `e2e/admin.spec.ts`

## CI/CD

**CI Pipeline:** Не обнаружен (нет `.github/workflows/`)

**Рекомендуемый локальный прогон перед PR:**
```bash
cp .env.test.example .env.test   # если ещё не создан
pnpm exec playwright install chromium
pnpm test:e2e
```

## Adding New Tests

**Новый E2E-сценарий:**
1. Создай `e2e/<domain>.spec.ts` или добавь в существующий `test.describe`
2. Используй `loginAs(page, TEST_CODES.<role>)` из `e2e/helpers/auth.ts`
3. Добавь константы в `e2e/helpers/codes.ts` только если seed даёт новые сущности
4. Для Ant Design Radio/Select — используй хелперы из `e2e/helpers/antd.ts` или паттерны из `admin.spec.ts`
5. Предпочитай `getByRole` над CSS-селекторами
6. Тексты assertion на русском, совпадают с UI

**Новый хелпер:**
- Размещай в `e2e/helpers/<name>.ts`
- Экспортируй именованные async-функции
- JSDoc для неочевидных обходов UI-библиотек

**Если нужны unit-тесты (сейчас отсутствуют):**
- Проект не имеет настроенного runner; потребуется добавить Vitest + конфиг
- Приоритетные кандидаты: `src/shared/lib/step-completion.ts`, `src/shared/lib/validations/*`, `src/features/journal/lib/*`

## Test Coverage Gaps

| Область | Файлы | Риск |
|---------|-------|------|
| API routes | `src/app/api/**` | Нет прямых тестов POST/DELETE sessions, step-completions |
| Server actions | `src/features/*/actions/*` | Логика создания пользователей, программы не покрыта изолированно |
| Shared lib | `src/shared/lib/*.ts` | Расчёт прогресса, календарные даты — только косвенно через E2E |
| Program admin / Tiptap | `src/features/program-admin/**` | Редактор шагов не покрыт E2E |
| Awards | `src/features/awards/**` | Страница открывается, CRUD наград не тестируется |
| Analytics | `src/features/analytics/**` | Только навигация и picker учителя |
| Theme settings | `src/features/theme-settings/**` | Не покрыто |
| User switcher | `src/features/auth/ui/UserSwitcher.tsx` | Не покрыто |

---

*Testing analysis: 2026-06-24*
