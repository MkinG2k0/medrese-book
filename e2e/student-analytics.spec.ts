import { expect, test, type Page } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";

async function ensureAnalyticsSubjectInUrl(page: Page) {
  await expect(page.getByRole("combobox", { name: "Предмет" })).toBeVisible();

  const url = new URL(page.url());
  if (!url.searchParams.has("subjectId")) {
    await page.getByRole("combobox", { name: "Предмет" }).click();
    await page.getByTitle("Коран", { exact: true }).click();
    await expect(page).toHaveURL(/subjectId=/);
  }
}

async function openHistoryModalFromAnalytics(page: Page) {
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Требуют внимания" }),
  ).toBeVisible();
  await ensureAnalyticsSubjectInUrl(page);

  const atRiskSection = page
    .locator("div")
    .filter({
      has: page.getByRole("heading", { name: "Требуют внимания" }),
    })
    .first();
  const atRiskDataRows = atRiskSection.locator(".ant-table-tbody tr");

  if ((await atRiskDataRows.count()) > 0) {
    await atRiskDataRows.first().click();
    return;
  }

  const topStudentsSection = page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: /Топ учеников/ }) })
    .first();
  const topRow = topStudentsSection
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: TEST_USERS.studentAli,
        exact: true,
      }),
    })
    .first();

  await expect(topRow).toBeVisible();
  await topRow.click();
}

test.describe("Аналитика ученика — учитель", () => {
  test.use({ storageState: AUTH_STATE.teacher2 });
  test.describe.configure({ mode: "serial" });

  test("таймер урока: начать → длительность → журнал → завершить", async ({
    page,
  }) => {
    await page.goto("/journal");
    await expect(
      page.getByRole("heading", { name: "Журнал на сегодня" }),
    ).toBeVisible();

    const startButton = page.getByRole("button", { name: "Начать урок" });
    if (await startButton.isVisible()) {
      await startButton.click();
      await expect(page.getByText("Урок начат")).toBeVisible();
    } else if (
      !(await page.getByRole("button", { name: "Закончить урок" }).isVisible())
    ) {
      test.skip(true, "Урок уже завершён сегодня — пропуск цикла start/end");
    }

    await expect(page.getByText("Урок идёт")).toBeVisible();
    await expect(page.getByText(/Длительность:/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: TEST_USERS.studentKhalid }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Закончить урок" }).click();
    await expect(page.getByText("Урок завершён")).toBeVisible();
  });

  test("at-risk или топ учеников открывает историю с длительностью занятия", async ({
    page,
  }) => {
    await openHistoryModalFromAnalytics(page);

    const dialog = page.getByRole("dialog", {
      name: /История учёбы/,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("columnheader", { name: "Длительность занятия" }),
    ).toBeVisible();
  });
});

test.describe("Аналитика ученика — учитель (группа 1)", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("страница аналитики загружается с блоком at-risk и селектом предмета", async ({
    page,
  }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Требуют внимания" }),
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Предмет" })).toBeVisible();
  });
});

test.describe("Аналитика — смена предмета", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("смена предмета сбрасывает groupId в URL", async ({ page }) => {
    await page.goto("/analytics");
    await ensureAnalyticsSubjectInUrl(page);

    const groupSelect = page.getByRole("combobox", { name: "Группа" });
    await expect(groupSelect).toBeVisible();
    await groupSelect.click();
    await page.getByTitle(`${TEST_USERS.group1} — Коран`, { exact: true }).click();
    await expect(page).toHaveURL(/groupId=/);

    await page.getByRole("combobox", { name: "Предмет" }).click();
    const subjectOptions = page.locator(
      ".ant-select-dropdown:visible .ant-select-item-option",
    );
    const optionCount = await subjectOptions.count();
    test.skip(
      optionCount < 2,
      "В seed-e2e один предмет — смена subjectId недоступна",
    );

    const secondSubject = subjectOptions.nth(1);
    const secondSubjectLabel = (await secondSubject.textContent())?.trim() ?? "";
    await secondSubject.click();

    await expect(page).toHaveURL(/subjectId=/);
    await expect(page).not.toHaveURL(/groupId=/);
    await expect(page.getByRole("combobox", { name: "Предмет" })).toContainText(
      secondSubjectLabel,
    );
  });
});

test.describe("Аналитика ученика — ученик", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test("портал показывает метрики периода без at-risk", async ({ page }) => {
    await page.goto("/student/me");
    await expect(page.getByRole("heading", { name: TEST_USERS.studentAli })).toBeVisible();
    await expect(page.getByText("Уроков")).toBeVisible();
    await expect(page.getByText("Шагов")).toBeVisible();
    await expect(page.getByText("Время обучения")).toBeVisible();
    await expect(page.getByText("Требуют внимания")).toHaveCount(0);
  });
});
