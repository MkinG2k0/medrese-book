import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";

test.describe("Навигация по ролям", () => {
  test.describe("учитель", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("видит пункты журнала и мою группу", async ({ page }) => {
      await page.goto("/journal");
      await expect(page.getByRole("menuitem", { name: "Журнал" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "История шагов" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Моя группа" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Группы" })).toHaveCount(0);
      await expect(page.getByRole("menuitem", { name: "Аналитика" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Пользователи" })).toHaveCount(0);
    });
  });

  test.describe("ученик", () => {
    test.use({ storageState: AUTH_STATE.studentAli });

    test("видит пункты прогресса и уроков", async ({ page }) => {
      await page.goto("/student/me");
      await expect(page.getByRole("menuitem", { name: "Мой прогресс" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Уроки" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Журнал" })).toHaveCount(0);
      await expect(page.getByRole("menuitem", { name: "Группы" })).toHaveCount(0);
      await expect(page.getByText("Сменить учётку")).toHaveCount(0);
    });
  });

  test.describe("менеджер", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test("видит админ-разделы", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByRole("menuitem", { name: "Пользователи" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Группы" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Программа" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Награды" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Журнал" })).toHaveCount(0);
    });
  });
});

test.describe("Моя группа", () => {
  test.describe("первый учитель", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("видит учеников своей группы", async ({ page }) => {
      await page.goto("/my-group");
      await expect(page.getByRole("heading", { name: "Моя группа" })).toBeVisible();
      await expect(page.getByText(TEST_USERS.group1)).toBeVisible();
      await expect(page.getByRole("main").getByText(TEST_USERS.studentAli)).toBeVisible();
      await expect(page.getByRole("main").getByText(TEST_USERS.studentUsman)).toBeVisible();
      await expect(page.getByRole("main").getByText(TEST_USERS.studentBilal)).toBeVisible();
    });
  });
});

test.describe("Группы", () => {
  test.describe("менеджер", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test("видит все группы", async ({ page }) => {
      await page.goto("/groups");
      await expect(page.getByRole("heading", { name: "Группы" })).toBeVisible();
      const group1Row = page.getByRole("row", { name: new RegExp(TEST_USERS.group1) });
      await expect(group1Row.getByRole("link", { name: TEST_USERS.group1 })).toBeVisible();
      const group2Row = page.getByRole("row", { name: new RegExp(TEST_USERS.group2) });
      await expect(group2Row.getByRole("link", { name: TEST_USERS.group2 })).toBeVisible();
    });

    test("открывает список учеников группы", async ({ page }) => {
      await page.goto("/groups");
      await page.getByRole("link", { name: TEST_USERS.group1 }).click();
      await expect(page).toHaveURL(/\/groups\/.+/);
      await expect(page.getByRole("main").getByText(TEST_USERS.studentAli)).toBeVisible();
      await expect(page.getByRole("main").getByText(TEST_USERS.studentUsman)).toBeVisible();
      await expect(page.getByRole("main").getByText(TEST_USERS.studentBilal)).toBeVisible();
    });
  });
});

test.describe("Аналитика", () => {
  test.describe("учитель", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("открывает страницу аналитики", async ({ page }) => {
      await page.goto("/analytics");
      await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();
    });
  });

  test.describe("менеджер", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test("видит выбор учителя", async ({ page }) => {
      await page.goto("/analytics");
      await page.getByRole("combobox").click();
      await expect(page.getByRole("option", { name: "Все учителя" })).toBeAttached();
      await expect(page.getByRole("option", { name: "Учитель Ахмад" })).toBeAttached();
    });
  });
});
