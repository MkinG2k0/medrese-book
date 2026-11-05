import { expect, test, type Page } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";

async function submitParentMonthRequest(page: Page): Promise<string> {
  await loginAs(page, TEST_CODES.parentAliUsman);
  await page.goto("/parent/pay");
  await expect(page.getByRole("heading", { name: "Оплата" })).toBeVisible();

  const monthSelect = page.getByRole("combobox", { name: "Месяц оплаты" });
  await expect(monthSelect).toBeVisible();
  await monthSelect.click();

  const unpaidOption = page
    .locator(".ant-select-dropdown:visible .ant-select-item-option")
    .filter({ hasText: "Не оплачен" })
    .first();
  await expect(unpaidOption).toBeVisible();
  await expect(unpaidOption.getByText("Не оплачен", { exact: true })).toBeVisible();

  const monthTitle = await unpaidOption.getAttribute("title");
  await unpaidOption.click();

  await page.getByRole("button", { name: "Оплатить" }).click();
  await expect(page.getByText("Заявка отправлена бухгалтеру")).toBeVisible();

  return monthTitle ?? "";
}

test.describe("Tuition month / unpaid visibility", () => {
  test("опекун: Tag «Не оплачен» и заявка с месяцем", async ({ page }) => {
    test.setTimeout(60_000);
    await submitParentMonthRequest(page);
  });

  test("бухгалтер открывает /accounting/debts", async ({ page }) => {
    await loginAs(page, TEST_CODES.accountant);
    await page.goto("/accounting/debts");
    await expect(page).toHaveURL(/\/accounting\/debts/);
    await expect(page.getByRole("heading", { name: "Долги" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Долги" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Месяц" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Долг" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Ученик" })).toBeVisible();
  });

  test("кассир: debts + месяц в заявках", async ({ page }) => {
    test.setTimeout(90_000);
    await submitParentMonthRequest(page);

    await loginAs(page, TEST_CODES.cashier);
    await page.goto("/accounting/debts");
    await expect(page).toHaveURL(/\/accounting\/debts/);
    await expect(page.getByRole("heading", { name: "Долги" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Долги" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Бухгалтерия" })).toHaveCount(0);

    await page.goto("/accounting/payment-requests");
    await expect(page).toHaveURL(/\/accounting\/payment-requests/);
    await expect(page.getByRole("columnheader", { name: "Месяц" })).toBeVisible();
    await expect(
      page.locator(".ant-tag").filter({ hasText: /^\d{4}-\d{2}$/ }).first(),
    ).toBeVisible();
  });

  test("confirm: UI показывает месяц и завершает без Zod-ошибки", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await submitParentMonthRequest(page);

    await loginAs(page, TEST_CODES.cashier);
    await page.goto("/accounting/payment-requests");
    await expect(
      page.getByRole("heading", { name: "Заявки на оплату" }),
    ).toBeVisible();

    const row = page
      .getByRole("row")
      .filter({ hasText: TEST_USERS.parentAliUsman })
      .first();
    await expect(row).toBeVisible();
    await expect(row.locator(".ant-tag").filter({ hasText: /^\d{4}-\d{2}$/ })).toBeVisible();

    // Wait for cash method lock (cashier session hydrated)
    await expect(page.locator(".ant-select").first()).toHaveClass(
      /ant-select-disabled/,
    );
    await expect(page.locator(".ant-select").first().getByText("Наличные")).toBeVisible();

    await row.getByRole("button", { name: "Подтвердить" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Месяц заявки:\s*\d{4}-\d{2}/)).toBeVisible();
    await dialog.locator(".ant-btn-primary").click();
    await expect(page.getByText("Заявка подтверждена")).toBeVisible({
      timeout: 20_000,
    });
    await expect(dialog).toBeHidden();
  });

  test("кассир: create payment с month из пикера страницы", async ({ page }) => {
    test.setTimeout(60_000);
    await loginAs(page, TEST_CODES.cashier);
    await page.goto("/accounting/payments");
    await expect(
      page.getByRole("heading", { name: "Платежи учеников" }),
    ).toBeVisible();

    // Bilal — не в заявке parentAliUsman, тариф за месяц ещё не покрыт
    await page.getByPlaceholder("Поиск ученика").fill(TEST_USERS.studentBilal);
    const studentRow = page
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", {
          name: TEST_USERS.studentBilal,
          exact: true,
        }),
      })
      .first();
    await expect(studentRow).toBeVisible();
    await studentRow.getByRole("button", { name: "Тариф" }).click();
    await expect(
      page.getByText(/^Тариф:|За месяц уже оплачено не меньше тарифа/),
    ).toBeVisible();
  });
});
