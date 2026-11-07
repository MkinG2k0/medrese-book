import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Платежи без колонки Сальдо", () => {
  test("у кассира нет Сальдо, статус виден", async ({ page }) => {
    await loginAs(page, TEST_CODES.cashier);
    await page.goto("/accounting/payments");
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "Сальдо" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Статус" }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("cell")
        .filter({ hasText: /Оплачено|Долг|Аванс|Частично/ })
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("у бухгалтера нет Сальдо на платежах", async ({ page }) => {
    await loginAs(page, TEST_CODES.accountant);
    await page.goto("/accounting/payments");
    await expect(page).toHaveURL(/\/accounting\/payments/);
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "Сальдо" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Статус" }),
    ).toBeVisible();
  });
});
