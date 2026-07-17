import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Настройки темы", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("навигация в настройки и переключение темы", async ({ page }) => {
    await page.goto("/journal");

    const settingsItem = page.getByRole("menuitem", { name: "Настройки" });
    await expect(settingsItem).toBeVisible();
    await settingsItem.click();
    await expect(page).toHaveURL(/\/settings/);

    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Светлая" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Тёмная" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Мечеть" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Сепия" })).toBeVisible();

    await page.getByRole("button", { name: "Тёмная" }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.classList.contains("dark")),
      )
      .toBe(true);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("app-theme")))
      .toBe("dark");

    await page.getByRole("button", { name: "Светлая" }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.classList.contains("dark")),
      )
      .toBe(false);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("app-theme")))
      .toBe("light");

    await page.getByRole("button", { name: "Мечеть" }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.classList.contains("sage")),
      )
      .toBe(true);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("app-theme")))
      .toBe("sage");
  });
});
