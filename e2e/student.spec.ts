import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Личный кабинет ученика", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test.beforeEach(async ({ page }) => {
    await page.goto("/student/me");
    await expect(page.getByRole("heading", { name: "Али" })).toBeVisible();
  });

  test("отображает карточки зачислений с прогрессом и метриками", async ({
    page,
  }) => {
    await expect(page.getByText(/Коран — Группа Аль-Фатиха/)).toBeVisible();
    await expect(page.getByText(/Таджвид — Группа Таджвид/)).toBeVisible();
    await expect(page.getByText(/Прогресс: шаг \d+ из \d+/).first()).toBeVisible();
    await expect(page.getByText("Уроков").first()).toBeVisible();
    await expect(page.getByText("Шагов").first()).toBeVisible();
    await expect(page.getByText("Время обучения").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Текущий урок:/ })).toHaveCount(0);
  });

  test("deep link с карточки передаёт groupId в URL уроков", async ({
    page,
  }) => {
    const tajweedCard = page
      .locator(".ant-card")
      .filter({ hasText: "Таджвид — Группа Таджвид" });
    await tajweedCard.getByRole("button", { name: "Уроки" }).click();
    await expect(page).toHaveURL(/groupId=/);
    await expect(page.getByRole("heading", { name: "Уроки" })).toBeVisible();
    await expect(page.getByText("Таджвид — Группа Таджвид")).toBeVisible();
  });

  test("меню Уроки без groupId открывает primary enrollment", async ({
    page,
  }) => {
    await page.getByRole("menuitem", { name: "Уроки" }).click();
    await expect(page).toHaveURL(/\/student\/lessons(?:\?.*)?$/);
    await expect(page.getByText(/Коран — Группа Аль-Фатиха/)).toBeVisible();
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

test.describe("Доп. задания ученика", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test("отображает историю с группировкой по предметам", async ({ page }) => {
    await page.goto("/student/extra-assignments");
    await expect(
      page.getByRole("heading", { name: "Доп. задания", level: 3 }),
    ).toBeVisible();
    await expect(page.getByText("Коран", { exact: true })).toBeVisible();
    await expect(page.getByText("Таджвид", { exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Хорошо" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Отлично" })).toBeVisible();
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
