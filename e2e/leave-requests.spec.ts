import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";
import {
  deactivateSubstitutionsForE2E,
  deleteLeaveRequestsByDescriptionContaining,
} from "./helpers/db";
import { startLessonIfNeeded } from "./helpers/journal";
import {
  approveLeaveViaUI,
  createLeaveViaUI,
  editRejectedLeaveViaUI,
  rejectLeaveViaUI,
  switchToSubstitutedTeacher,
  uniqueLeaveDescription,
} from "./helpers/leave-requests";

const E2E_PREFIX = "Leave E2E";
const SUBSTITUTION_ROLE_LABEL = "Учитель — Замещение";

test.describe("Заявки на отсутствие", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  let approvedDescription: string;
  let rejectDescription: string;
  let resubmitDescription: string;

  test.beforeAll(async () => {
    await deactivateSubstitutionsForE2E();
    await deleteLeaveRequestsByDescriptionContaining(E2E_PREFIX);
  });

  test.afterAll(async () => {
    await deleteLeaveRequestsByDescriptionContaining(E2E_PREFIX);
    await deactivateSubstitutionsForE2E();
  });

  test.describe("teacher2 без замещения", () => {
    test.use({ storageState: AUTH_STATE.teacher2 });

    test("не видит переключатель учётки или не может сменить на teacher1", async ({
      page,
    }) => {
      await page.goto("/journal");
      await expect(
        page.getByRole("heading", { name: "Журнал на сегодня" }),
      ).toBeVisible();

      const switcher = page
        .getByRole("button")
        .filter({ has: page.locator(".ant-avatar") });
      if ((await switcher.count()) === 0) {
        return;
      }

      await switcher.click();
      await expect(
        page.getByRole("menuitem").filter({ hasText: TEST_USERS.teacher1Name }),
      ).toHaveCount(0);
    });
  });

  test.describe("создание заявок учителем", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("создаёт отгул — badge «Создана» на календаре", async ({ page }) => {
      approvedDescription = uniqueLeaveDescription(`${E2E_PREFIX} dayoff`);
      await createLeaveViaUI(page, {
        type: "dayoff",
        description: approvedDescription,
      });

      await expect(page.getByText("Отгул · Создана")).toBeVisible();
      await expect(
        page.getByRole("row").filter({ hasText: approvedDescription }),
      ).toBeVisible();
    });

    test("создаёт больничный через модалку «Новый больничный»", async ({
      page,
    }) => {
      const sickDescription = uniqueLeaveDescription(`${E2E_PREFIX} sick`);
      await createLeaveViaUI(page, {
        type: "sick",
        description: sickDescription,
      });

      await expect(page.getByText("Больничный · Создана")).toBeVisible();
      await expect(
        page.getByRole("row").filter({ hasText: sickDescription }),
      ).toBeVisible();
    });

    test("создаёт заявку для последующего отклонения", async ({ page }) => {
      rejectDescription = uniqueLeaveDescription(`${E2E_PREFIX} reject`);
      await createLeaveViaUI(page, {
        type: "dayoff",
        description: rejectDescription,
      });
    });
  });

  test.describe("действия менеджера", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test("подтверждает заявку с замещающим", async ({ page }) => {
      await approveLeaveViaUI(
        page,
        TEST_USERS.teacher1Name,
        TEST_USERS.teacher2Name,
        approvedDescription,
      );

      await page.locator(".ant-select").filter({ hasText: "Все" }).first().click();
      await page.getByTitle("Подтверждена", { exact: true }).click();
      await expect(
        page.getByRole("row").filter({ hasText: approvedDescription }),
      ).toBeVisible();
      await expect(page.getByText("Отгул · Подтверждена")).toHaveCount(0);
    });

    test("отклоняет заявку с причиной — не на календаре менеджера", async ({
      page,
    }) => {
      await rejectLeaveViaUI(
        page,
        TEST_USERS.teacher1Name,
        "Нет замены в этот период",
        rejectDescription,
      );

      await page.locator(".ant-select").filter({ hasText: "Все" }).first().click();
      await page.getByTitle("Отклонена", { exact: true }).click();
      await expect(
        page.getByRole("row").filter({ hasText: rejectDescription }),
      ).toBeVisible();
      await expect(page.getByText(rejectDescription)).toHaveCount(1);
    });
  });

  test.describe("грид учителя и resubmit", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("показывает отклонённую заявку в таблице", async ({ page }) => {
      await page.goto("/calendar");
      await page.locator(".ant-select").filter({ hasText: "Все статусы" }).click();
      await page.getByTitle("Отклонена", { exact: true }).click();

      const row = page.getByRole("row").filter({ hasText: rejectDescription });
      await expect(row).toBeVisible();
      await expect(row.getByText("Отклонена")).toBeVisible();
    });

    test("редактирует и повторно отправляет отклонённую заявку", async ({
      page,
    }) => {
      resubmitDescription = uniqueLeaveDescription(`${E2E_PREFIX} resubmit`);
      await editRejectedLeaveViaUI(
        page,
        rejectDescription,
        resubmitDescription,
      );

      await page.goto("/calendar");
      await expect(
        page.getByRole("row").filter({ hasText: resubmitDescription }),
      ).toBeVisible();
    });
  });

  test.describe("доступ teacher1", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("не может открыть /admin/leave-calendar", async ({ page }) => {
      await page.goto("/admin/leave-calendar");
      await expect(page).not.toHaveURL(/\/admin\/leave-calendar/);
    });
  });

  test.describe("замещение teacher2", () => {
    test.use({ storageState: AUTH_STATE.teacher2 });

    test("переключается на teacher1 и открывает журнал замещаемого", async ({
      page,
    }) => {
      await page.goto("/journal");
      await page.waitForResponse(
        (response) =>
          response.url().includes("/api/auth/session") && response.ok(),
      );
      await switchToSubstitutedTeacher(page, TEST_USERS.teacher1Name);
      await expect(
        page.getByRole("banner").getByText(SUBSTITUTION_ROLE_LABEL),
      ).toBeVisible();

      await expect(
        page.getByRole("heading", { name: "Журнал на сегодня" }),
      ).toBeVisible();
      await startLessonIfNeeded(page);
      await expect(
        page.getByRole("row", { name: new RegExp(TEST_USERS.studentAli) }),
      ).toBeVisible();
    });
  });
});
