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
    await expect(page.locator(".ant-picker").first()).toBeVisible();
  });
});

test.describe("Аналитика учителей — учитель", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("не имеет доступа к аналитике учителей", async ({ page }) => {
    await page.goto("/analytics/teachers");
    await expect(page).not.toHaveURL(/\/analytics\/teachers$/);
  });

  test("видит объединённую страницу зарплаты и часов", async ({ page }) => {
    await page.goto("/accounting/my-salary");
    await expect(page).toHaveURL(/\/accounting\/my-salary/);
    await expect(
      page.getByRole("heading", { name: "Моя зарплата" }),
    ).toBeVisible();
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

  test("старый URL /analytics/my-hours перенаправляет на /accounting/my-salary", async ({
    page,
  }) => {
    await page.goto("/analytics/my-hours");
    await expect(page).toHaveURL(/\/accounting\/my-salary/);
    await expect(
      page.getByRole("heading", { name: "Моя зарплата" }),
    ).toBeVisible();
  });
});
