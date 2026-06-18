import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, code: string) {
  await page.goto("/login");
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((url) => !/\/login$/.test(url.pathname), { waitUntil: "commit" });
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login/);
}
