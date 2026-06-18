import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";

test.describe("Навигация по ролям", () => {
  test("учитель видит пункты журнала и групп", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await expect(page.getByRole("menuitem", { name: "Журнал" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "История шагов" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Группы" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Аналитика" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Пользователи" })).toHaveCount(0);
  });

  test("ученик видит только «Мой прогресс»", async ({ page }) => {
    await loginAs(page, TEST_CODES.studentAli);
    await expect(page.getByRole("menuitem", { name: "Мой прогресс" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Журнал" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Группы" })).toHaveCount(0);
  });

  test("менеджер видит админ-разделы", async ({ page }) => {
    await loginAs(page, TEST_CODES.manager);
    await expect(page.getByRole("menuitem", { name: "Пользователи" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Группы (админ)" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Программа" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Награды" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Журнал" })).toHaveCount(0);
  });
});

test.describe("Группы", () => {
  test("учитель видит свою группу", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await page.getByRole("menuitem", { name: "Группы" }).click();
    await expect(page).toHaveURL(/\/groups/);
    await expect(page.getByRole("heading", { name: "Группы" })).toBeVisible();
    const group1Row = page.getByRole("row", { name: new RegExp(TEST_USERS.group1) });
    await expect(group1Row.getByRole("link", { name: TEST_USERS.group1 })).toBeVisible();
    const studentCount = Number(await group1Row.getByRole("cell").nth(2).textContent());
    expect(studentCount).toBeGreaterThanOrEqual(3);
  });

  test("второй учитель видит другую группу", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher2);
    await page.getByRole("menuitem", { name: "Группы" }).click();
    const group2Row = page.getByRole("row", { name: new RegExp(TEST_USERS.group2) });
    await expect(group2Row.getByRole("link", { name: TEST_USERS.group2 })).toBeVisible();
    await expect(group2Row.getByText("2")).toBeVisible();
  });

  test("открывает список учеников группы", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await page.getByRole("menuitem", { name: "Группы" }).click();
    await page.getByRole("link", { name: TEST_USERS.group1 }).click();
    await expect(page).toHaveURL(/\/groups\/.+/);
    await expect(page.getByRole("main").getByText(TEST_USERS.studentAli)).toBeVisible();
    await expect(page.getByRole("main").getByText(TEST_USERS.studentUsman)).toBeVisible();
    await expect(page.getByRole("main").getByText(TEST_USERS.studentBilal)).toBeVisible();
  });
});

test.describe("Аналитика", () => {
  test("учитель открывает страницу аналитики", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await page.getByRole("menuitem", { name: "Аналитика" }).click();
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();
  });

  test("менеджер видит выбор учителя", async ({ page }) => {
    await loginAs(page, TEST_CODES.manager);
    await page.getByRole("menuitem", { name: "Аналитика" }).click();
    await page.getByRole("combobox").click();
    await expect(page.getByRole("option", { name: "Все учителя" })).toBeAttached();
    await expect(page.getByRole("option", { name: "Учитель Ахмад" })).toBeAttached();
  });
});
