import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Роль кассира", () => {
  test("вход кассира ведёт на платежи и узкое меню", async ({ page }) => {
    await loginAs(page, TEST_CODES.cashier);
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();

    await expect(
      page.getByRole("menuitem", { name: "Платежи" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Заявки на оплату" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Бухгалтерия" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("menuitem", { name: "Зарплаты" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Расходы" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Операции" })).toHaveCount(0);
  });

  test("заявки кассира — только наличные", async ({ page }) => {
    await loginAs(page, TEST_CODES.cashier);
    await page.goto("/accounting/payment-requests");
    await expect(page).toHaveURL(/\/accounting\/payment-requests/);
    await expect(
      page.getByRole("heading", { name: "Заявки на оплату" }),
    ).toBeVisible();

    const methodSelect = page.locator(".ant-select").first();
    await expect(methodSelect).toHaveClass(/ant-select-disabled/);
    await expect(methodSelect.getByText("Наличные")).toBeVisible();
    await expect(page.getByTitle("Карта")).toHaveCount(0);
    await expect(page.getByTitle("Перевод")).toHaveCount(0);
  });

  test("кассир не открывает дашборд и зарплаты", async ({ page }) => {
    await loginAs(page, TEST_CODES.cashier);

    await page.goto("/accounting");
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();

    await page.goto("/accounting/salaries");
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();
  });

  test("бухгалтер сохраняет полный доступ к платежам", async ({ page }) => {
    await loginAs(page, TEST_CODES.accountant);
    await expect(page).toHaveURL(/\/accounting\/?$/);

    await page.goto("/accounting/payments");
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();

    const methodSelect = page.locator(".ant-select").first();
    await expect(methodSelect).not.toHaveClass(/ant-select-disabled/);
    await methodSelect.click();
    await expect(page.locator(".ant-select-item-option[title='Карта']")).toBeVisible();
    await expect(
      page.locator(".ant-select-item-option[title='Перевод']"),
    ).toBeVisible();
  });
});
