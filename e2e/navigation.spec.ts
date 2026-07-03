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
      await expect(page.getByRole("menuitem", { name: "Календарь" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Группы" })).toHaveCount(0);
      await expect(page.getByRole("menuitem", { name: "Аналитика" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Календарь отпусков" })).toHaveCount(0);
      await expect(page.getByRole("menuitem", { name: "Пользователи" })).toHaveCount(0);
    });
  });

  test.describe("ученик", () => {
    test.use({ storageState: AUTH_STATE.studentAli });

    test("видит пункты прогресса, уроков, истории и наград", async ({ page }) => {
      await page.goto("/student/me");
      await expect(page.getByRole("menuitem", { name: "Мой прогресс" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Уроки" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "История занятий" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Награды" })).toBeVisible();
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
      await expect(page.getByRole("menuitem", { name: "Календарь отпусков" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Календарь" })).toHaveCount(0);
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

    test("редактирует группу", async ({ page }) => {
      const newName = `Группа E2E ${Date.now()}`;

      await page.goto("/groups");
      const group1Row = page.getByRole("row", { name: new RegExp(TEST_USERS.group1) });
      await group1Row.getByRole("button", { name: "Редактировать" }).click();

      const dialog = page.getByRole("dialog", { name: "Редактировать группу" });
      await dialog.getByRole("textbox").fill(newName);
      await dialog.locator(".ant-select").click();
      await page.getByTitle(TEST_USERS.teacher2Name, { exact: true }).click();
      await dialog.getByRole("button", { name: "Сохранить" }).click();

      const updatedRow = page.getByRole("row", { name: new RegExp(newName) });
      await expect(updatedRow.getByRole("link", { name: newName })).toBeVisible();
      await expect(updatedRow.getByRole("cell", { name: TEST_USERS.teacher2Name, exact: true })).toBeVisible();

      await updatedRow.getByRole("button", { name: "Редактировать" }).click();
      await dialog.getByRole("textbox").fill(TEST_USERS.group1);
      await dialog.locator(".ant-select").click();
      await page.getByTitle(TEST_USERS.teacher1Name, { exact: true }).click();
      await dialog.getByRole("button", { name: "Сохранить" }).click();
      await expect(page.getByRole("link", { name: TEST_USERS.group1 })).toBeVisible();
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
