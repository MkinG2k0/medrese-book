import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Новости — менеджер", () => {
  test.use({ storageState: AUTH_STATE.manager });

  test("видит ленту и кнопку создания", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { name: "Новости" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Создать" }),
    ).toBeVisible();
  });

  test("может опубликовать новость", async ({ page }) => {
    const title = `E2E новость ${Date.now()}`;

    await page.goto("/news");
    await page.getByRole("button", { name: "Создать" }).click();

    const dialog = page.getByRole("dialog", { name: "Новая публикация" });
    await dialog.getByPlaceholder("Заголовок новости").fill(title);
    await dialog.locator(".step-editor-content").click();
    await page.keyboard.type("Текст тестовой публикации");

    await dialog.getByRole("button", { name: "Опубликовать" }).click();

    await expect(page.getByText("Новость опубликована")).toBeVisible();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });
});

test.describe("Новости — учитель", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("видит ленту без кнопки создания", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { name: "Новости" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Создать" }),
    ).not.toBeVisible();

    const likeButton = page
      .getByRole("button")
      .filter({ hasText: /^\d+$/ })
      .first();
    if (await likeButton.isVisible()) {
      await likeButton.click();
    }
  });
});

test.describe("Новости — ученик", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test("видит ленту новостей", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { name: "Новости" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Создать" }),
    ).not.toBeVisible();
  });
});
