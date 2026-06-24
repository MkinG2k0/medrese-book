import { expect } from "@playwright/test";

export async function startLessonIfNeeded(page: import("@playwright/test").Page) {
  const startButton = page.getByRole("button", { name: "Начать урок" });
  if (await startButton.isVisible()) {
    await startButton.click();
    await expect(page.getByText("Урок идёт")).toBeVisible();
  }
}
