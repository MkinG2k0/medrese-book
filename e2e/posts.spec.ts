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

  test("может опубликовать системную новость с тегом", async ({ page }) => {
    const title = `E2E системная ${Date.now()}`;

    await page.goto("/news");
    await page.getByRole("button", { name: "Создать" }).click();

    const dialog = page.getByRole("dialog", { name: "Новая публикация" });
    await dialog.getByPlaceholder("Заголовок новости").fill(title);
    await dialog.getByRole("radio", { name: "Системная" }).check();
    await dialog.locator(".step-editor-content").click();
    await page.keyboard.type("Системное сообщение для персонала");

    await dialog.getByRole("button", { name: "Опубликовать" }).click();

    await expect(page.getByText("Новость опубликована")).toBeVisible();
    const heading = page.getByRole("heading", { name: title });
    await expect(heading).toBeVisible();
    const card = page.locator(".ant-card").filter({ has: heading });
    await expect(card.getByText("Системная", { exact: true })).toBeVisible();
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

test.describe("Системные новости — видимость по ролям", () => {
  test("учитель видит SYSTEM, ученик — нет", async ({ browser }) => {
    const title = `E2E системная visibility ${Date.now()}`;

    const managerContext = await browser.newContext({
      storageState: AUTH_STATE.manager,
    });
    const managerPage = await managerContext.newPage();
    await managerPage.goto("/news");
    await managerPage.getByRole("button", { name: "Создать" }).click();

    const dialog = managerPage.getByRole("dialog", {
      name: "Новая публикация",
    });
    await dialog.getByPlaceholder("Заголовок новости").fill(title);
    await dialog.getByRole("radio", { name: "Системная" }).check();
    await dialog.locator(".step-editor-content").click();
    await managerPage.keyboard.type("Только для персонала");
    await dialog.getByRole("button", { name: "Опубликовать" }).click();
    await expect(managerPage.getByText("Новость опубликована")).toBeVisible();
    await expect(
      managerPage.getByRole("heading", { name: title }),
    ).toBeVisible();
    await managerContext.close();

    const teacherContext = await browser.newContext({
      storageState: AUTH_STATE.teacher1,
    });
    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto("/news");
    await expect(
      teacherPage.getByRole("heading", { name: title }),
    ).toBeVisible();
    await teacherContext.close();

    const studentContext = await browser.newContext({
      storageState: AUTH_STATE.studentAli,
    });
    const studentPage = await studentContext.newPage();
    await studentPage.goto("/news");
    await expect(
      studentPage.getByRole("heading", { name: "Новости" }),
    ).toBeVisible();
    await expect(
      studentPage.getByRole("heading", { name: title }),
    ).toHaveCount(0);
    await studentContext.close();
  });
});
