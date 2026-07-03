import { expect, test, type Page } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";
import {
  deactivateSubstitutionsForE2E,
  deleteLeaveRequestsByDescriptionContaining,
} from "./helpers/db";
import {
  approveLeaveViaUI,
  createLeaveViaUI,
  rejectLeaveViaUI,
} from "./helpers/leave-requests";
import {
  countUnreadNotifications,
  getUserIdByCode,
  isNotificationSchemaAvailable,
} from "./helpers/notifications";

const E2E_PREFIX = "Notifications E2E";

function uniqueNotificationDescription(label: string) {
  return `Ntf-${label}-${Date.now()}`;
}

function getBannerBadge(page: Page) {
  return page.getByRole("banner").locator(".ant-scroll-number");
}

async function getBadgeCount(page: Page): Promise<number> {
  const badge = getBannerBadge(page);
  const count = await badge.count();
  if (count === 0) return 0;
  const text = await badge.first().textContent();
  return Number.parseInt(text?.trim() ?? "0", 10);
}

async function openNotificationDropdown(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: "Уведомления" }).click();
  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/notifications") &&
      !response.url().includes("/stream") &&
      response.ok(),
  );
}

function notificationItem(page: Page, text: string) {
  return page.getByRole("listitem").filter({ hasText: text });
}

async function gotoWithNotifications(page: Page, path: string) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/notifications/unread-count") &&
        response.ok(),
    ),
    page.goto(path, { waitUntil: "domcontentloaded" }),
  ]);
}

test.describe("Уведомления", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test.beforeAll(async () => {
    await deactivateSubstitutionsForE2E();
    await deleteLeaveRequestsByDescriptionContaining("Ntf-");
    await deleteLeaveRequestsByDescriptionContaining(E2E_PREFIX);
  });

  test.afterAll(async () => {
    await deleteLeaveRequestsByDescriptionContaining("Ntf-");
    await deleteLeaveRequestsByDescriptionContaining(E2E_PREFIX);
    await deactivateSubstitutionsForE2E();
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
      await gotoWithNotifications(managerPage, "/admin/leave-calendar");
      await expect(
        managerPage.getByRole("heading", { name: "Календарь отпусков" }),
      ).toBeVisible();

      const initialCount = await getBadgeCount(managerPage);
      const description = uniqueNotificationDescription("realtime");

      await createLeaveViaUI(teacherPage, {
        type: "dayoff",
        description,
      });

      await expect
        .poll(() => getBadgeCount(managerPage), { timeout: 15_000 })
        .toBeGreaterThan(initialCount);
    } finally {
      await managerContext.close();
      await teacherContext.close();
    }
  });

  test("менеджер видит «Новая заявка на отсутствие» в dropdown", async ({
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
      const description = uniqueNotificationDescription("new-request");

      await createLeaveViaUI(teacherPage, {
        type: "dayoff",
        description,
      });

      await gotoWithNotifications(managerPage, "/admin/leave-calendar");
      await expect
        .poll(() => getBadgeCount(managerPage), { timeout: 15_000 })
        .toBeGreaterThan(0);

      await openNotificationDropdown(managerPage);

      await expect(
        notificationItem(managerPage, TEST_USERS.teacher1Name)
          .getByText("Новая заявка на отсутствие")
          .first(),
      ).toBeVisible();
      await expect(
        notificationItem(managerPage, TEST_USERS.teacher1Name).getByText("Отпуск").first(),
      ).toBeVisible();
    } finally {
      await managerContext.close();
      await teacherContext.close();
    }
  });

  test.describe("mark all read", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test("«Отметить все прочитанными» уменьшает badge", async ({ page }) => {
    await gotoWithNotifications(page, "/admin/leave-calendar");

    const beforeCount = await getBadgeCount(page);
    test.skip(beforeCount === 0, "Нет непрочитанных уведомлений для теста");

    await openNotificationDropdown(page);
    await page.getByRole("button", { name: "Отметить все прочитанными" }).click();

    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/notifications/mark-read") && response.ok(),
    );

    await expect
      .poll(() => getBadgeCount(page), { timeout: 10_000 })
      .toBe(0);

    if (await isNotificationSchemaAvailable()) {
      const managerUserId = await getUserIdByCode(TEST_CODES.manager);
      expect(await countUnreadNotifications(managerUserId)).toBe(0);
    }
    });
  });

  test("учитель получает «Заявка подтверждена» после approve", async ({
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
      const description = uniqueNotificationDescription("approved");

      await createLeaveViaUI(teacherPage, {
        type: "dayoff",
        description,
      });

      await approveLeaveViaUI(
        managerPage,
        TEST_USERS.teacher1Name,
        TEST_USERS.teacher2Name,
        description,
      );

      await gotoWithNotifications(teacherPage, "/calendar");
      await openNotificationDropdown(teacherPage);

      await expect(
        notificationItem(teacherPage, "Отпуск").getByText("Заявка подтверждена").first(),
      ).toBeVisible();
    } finally {
      await managerContext.close();
      await teacherContext.close();
    }
  });

  test("учитель получает «Заявка отклонена» после reject с причиной", async ({
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
      const description = uniqueNotificationDescription("rejected");

      await createLeaveViaUI(teacherPage, {
        type: "dayoff",
        description,
      });

      await rejectLeaveViaUI(
        managerPage,
        TEST_USERS.teacher1Name,
        "Нет замены в этот период",
        description,
      );

      await gotoWithNotifications(teacherPage, "/calendar");
      await openNotificationDropdown(teacherPage);

      await expect(
        notificationItem(teacherPage, "Причина: Нет замены в этот период")
          .getByText("Заявка отклонена")
          .first(),
      ).toBeVisible();
      await expect(
        teacherPage.getByText("Причина: Нет замены в этот период"),
      ).toBeVisible();
    } finally {
      await managerContext.close();
      await teacherContext.close();
    }
  });

  test("замещающий получает «Вы замещаете» после approve", async ({
    browser,
  }) => {
    const managerContext = await browser.newContext({
      storageState: AUTH_STATE.manager,
    });
    const teacher1Context = await browser.newContext({
      storageState: AUTH_STATE.teacher1,
    });
    const teacher2Context = await browser.newContext({
      storageState: AUTH_STATE.teacher2,
    });

    const managerPage = await managerContext.newPage();
    const teacher1Page = await teacher1Context.newPage();
    const teacher2Page = await teacher2Context.newPage();

    try {
      const description = uniqueNotificationDescription("substitute");

      await createLeaveViaUI(teacher1Page, {
        type: "dayoff",
        description,
      });

      await approveLeaveViaUI(
        managerPage,
        TEST_USERS.teacher1Name,
        TEST_USERS.teacher2Name,
        description,
      );

      await gotoWithNotifications(teacher2Page, "/journal");
      await openNotificationDropdown(teacher2Page);

      await expect(
        notificationItem(teacher2Page, TEST_USERS.teacher1Name)
          .getByText("Вы замещаете")
          .first(),
      ).toBeVisible();
    } finally {
      await managerContext.close();
      await teacher1Context.close();
      await teacher2Context.close();
    }
  });
});
