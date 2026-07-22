import { expect, test, type Page } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";

async function openMessages(page: Page) {
  await page.goto("/messages");
  await expect(page.getByText("Сообщения").first()).toBeVisible();
}

async function startChatWith(page: Page, label: string) {
  await page.locator(".ant-select").first().click();
  await page.getByTitle(label, { exact: false }).click();
}

test.describe("Сообщения", () => {
  test.describe.configure({ mode: "serial" });

  test("учитель пишет своему ученику", async ({ page }) => {
    const message = `E2E teacher msg ${Date.now()}`;
    await loginAs(page, TEST_CODES.teacher1);
    await openMessages(page);
    await startChatWith(page, `${TEST_USERS.studentAli} Ученик`);
    await expect(page.getByText(TEST_USERS.studentAli).first()).toBeVisible();
    await page.getByPlaceholder("Введите сообщение…").fill(message);
    await page
      .getByRole("button")
      .filter({ has: page.locator(".anticon-send") })
      .click();
    await expect(page.getByText(message)).toBeVisible();
  });

  test("учитель отправляет фото ученику", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await openMessages(page);
    await startChatWith(page, `${TEST_USERS.studentAli} Ученик`);
    await expect(page.getByText(TEST_USERS.studentAli).first()).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Прикрепить фото" }),
    ).toBeVisible();
    const fileInput = page.locator('input[type="file"][accept*="image/jpeg"]');
    await fileInput.setInputFiles("e2e/fixtures/chat-photo.png");

    await expect(page.getByAltText("Превью")).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Отправить" }).click();
    await expect(
      page.locator(".ant-image img, img[alt='Фото']").first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("ученик видит диалог с учителем и пишет менеджеру", async ({ page }) => {
    const reply = `E2E student reply ${Date.now()}`;
    await loginAs(page, TEST_CODES.studentAli);
    await openMessages(page);
    await page.getByText(TEST_USERS.teacher1Name).first().click();
    await startChatWith(page, "Менеджер Менеджер");
    await page.getByPlaceholder("Введите сообщение…").fill(reply);
    await page
      .getByRole("button")
      .filter({ has: page.locator(".anticon-send") })
      .click();
    await expect(page.getByText(reply)).toBeVisible();
  });

  test("менеджер видит диалоги учителей", async ({ page }) => {
    await loginAs(page, TEST_CODES.manager);
    await openMessages(page);
    await expect(page.getByText("Диалоги учителей")).toBeVisible();
    await expect(
      page.getByText(`${TEST_USERS.teacher1Name} ↔ ${TEST_USERS.studentAli}`),
    ).toBeVisible();
  });

  test("супер-админ не видит Сообщения в меню", async ({ page }) => {
    await loginAs(page, TEST_CODES.superAdmin);
    await page.goto("/dashboard");
    await expect(page.getByText("Сообщения")).toHaveCount(0);
  });
});
