import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { deleteLeaveRequestsByDescriptionContaining } from "./helpers/db";
import {
  createLeaveViaUI,
  uniqueLeaveDescription,
} from "./helpers/leave-requests";

const E2E_PREFIX = "Realtime E2E";

test.describe("Realtime уведомления", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  test.beforeAll(async () => {
    await deleteLeaveRequestsByDescriptionContaining(E2E_PREFIX);
  });

  test.afterAll(async () => {
    await deleteLeaveRequestsByDescriptionContaining(E2E_PREFIX);
  });

  test("badge менеджера обновляется без reload при новой заявке учителя", async ({
    browser,
  }) => {
    const managerContext = await browser.newContext({
      storageState: AUTH_STATE.manager,
    });
    const teacherContext = await browser.newContext({
      storageState: AUTH_STATE.teacher1,
    });

    const managerPage = await managerContext.newPage();
    const teacherPage = await teacherContext.newPage();

    try {
      await Promise.all([
        managerPage.waitForResponse(
          (response) =>
            response.url().includes("/api/leave-requests") &&
            response.status() === 200,
        ),
        managerPage.goto("/admin/leave-calendar", {
          waitUntil: "domcontentloaded",
        }),
      ]);
      await expect(
        managerPage.getByRole("heading", { name: "Календарь отпусков" }),
      ).toBeVisible();

      const banner = managerPage.getByRole("banner");
      const badge = banner.locator(".ant-scroll-number");

      const getBadgeCount = async () => {
        const count = await badge.count();
        if (count === 0) return 0;
        const text = await badge.first().textContent();
        return Number.parseInt(text?.trim() ?? "0", 10);
      };

      const initialCount = await getBadgeCount();

      const description = uniqueLeaveDescription(`${E2E_PREFIX} leave`);
      await createLeaveViaUI(teacherPage, {
        type: "dayoff",
        description,
      });

      await expect
        .poll(getBadgeCount, { timeout: 10_000 })
        .toBeGreaterThan(initialCount);
    } finally {
      await managerContext.close();
      await teacherContext.close();
    }
  });
});
