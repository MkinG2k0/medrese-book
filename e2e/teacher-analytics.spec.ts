import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Аналитика учителей — менеджер", () => {
  test.use({ storageState: AUTH_STATE.manager });

  test("видит страницу аналитики учителей", async ({ page }) => {
    await page.goto("/analytics/teachers");
    await expect(
      page.getByRole("heading", { name: "Аналитика учителей" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Учитель" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Пришел" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Ушел" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность урока" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность на раб. месте" }),
    ).toBeVisible();
  });
});

test.describe("Аналитика учителей — учитель", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("не имеет доступа к аналитике учителей", async ({ page }) => {
    await page.goto("/analytics/teachers");
    await expect(page).not.toHaveURL(/\/analytics\/teachers$/);
  });

  test("видит страницу своих часов", async ({ page }) => {
    await page.goto("/analytics/my-hours");
    await expect(page).toHaveURL(/\/analytics\/my-hours$/);
    await expect(
      page.getByRole("heading", { name: "Мои часы" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Пришел" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Ушел" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность урока" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность на раб. месте" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Учитель" }),
    ).not.toBeVisible();
  });
});
