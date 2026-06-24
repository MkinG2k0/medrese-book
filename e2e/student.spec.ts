import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Личный кабинет ученика", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test.beforeEach(async ({ page }) => {
    await page.goto("/student/me");
    await expect(page.getByRole("heading", { name: "Али" })).toBeVisible();
  });

  test("отображает профиль и прогресс", async ({ page }) => {
    await expect(page.getByText(/Прогресс: шаг \d+ из \d+/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Текущий урок:/ })).toHaveCount(0);
  });

  test("не показывает раздел наград на странице прогресса", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Награды" })).toHaveCount(0);
  });

  test("не показывает смену учётки", async ({ page }) => {
    await expect(page.getByText("Сменить учётку")).toHaveCount(0);
  });

  test("не имеет доступа к журналу учителя", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Награды ученика", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test("отображает страницу наград", async ({ page }) => {
    await page.goto("/student/awards");
    await expect(page.getByRole("heading", { name: "Награды", level: 3 })).toBeVisible();
    await expect(page.getByText("Пока нет наград")).toBeVisible();
  });
});

test.describe("Уроки ученика", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test("отображает список всех уроков уровня", async ({ page }) => {
    await page.goto("/student/lessons");
    await expect(page.getByRole("heading", { name: "Уроки" })).toBeVisible();
    await expect(page.getByText(/Урок 1:/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "История занятий" })).toHaveCount(0);
  });
});

test.describe("История занятий ученика", () => {
  test.use({ storageState: AUTH_STATE.studentUsman });

  test("ученик с пройденными шагами видит занятия и оценки", async ({
    page,
  }) => {
    await page.goto("/student/history");
    await expect(page.getByRole("heading", { name: "История занятий" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Пришёл" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Хорошо" })).toBeVisible();
  });
});
