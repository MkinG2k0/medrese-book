import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";

async function pickAntdSelectOption(page: Page, combobox: Locator, label: string) {
  await combobox.click();
  await page
    .locator(".ant-select-dropdown:visible .ant-select-item-option")
    .filter({ hasText: label })
    .click();
}

test.describe("Группы: предмет и фильтр", () => {
  test.describe("менеджер", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test.beforeEach(async ({ page }) => {
      await page.goto("/groups");
      await expect(page.getByRole("heading", { name: "Группы" })).toBeVisible();
    });

    test("менеджер создаёт группу с выбором предмета в модалке", async ({
      page,
    }) => {
      const groupName = `Группа E2E ${Date.now()}`;

      await page.getByRole("button", { name: "Создать группу" }).click();
      const dialog = page.getByRole("dialog", { name: "Создать группу" });
      await expect(dialog).toBeVisible();

      await pickAntdSelectOption(
        page,
        dialog
          .locator(".ant-form-item")
          .filter({ hasText: "Предмет" })
          .getByRole("combobox"),
        "Коран",
      );

      await dialog.getByLabel("Название").fill(groupName);

      await pickAntdSelectOption(
        page,
        dialog
          .locator(".ant-form-item")
          .filter({ hasText: "Учитель" })
          .getByRole("combobox"),
        TEST_USERS.teacher1Name,
      );

      await dialog.getByRole("button", { name: "Создать группу" }).click();
      await expect(dialog).toBeHidden();
      await expect(
        page.getByRole("cell", { name: groupName, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("row", { name: new RegExp(groupName) }).getByRole("cell", {
          name: "Коран",
          exact: true,
        }),
      ).toBeVisible();
    });

    test("редактирование: поле предмета read-only", async ({ page }) => {
      await page.getByRole("button", { name: "Редактировать" }).first().click();
      const dialog = page.getByRole("dialog", { name: "Редактировать группу" });
      await expect(dialog).toBeVisible();

      const subjectInput = dialog
        .locator(".ant-form-item")
        .filter({ hasText: "Предмет" })
        .locator("input");
      await expect(subjectInput).toBeDisabled();
      await expect(subjectInput).toHaveValue("Коран");
    });

    test("список /groups: колонка «Предмет» и фильтр по предмету", async ({
      page,
    }) => {
      await expect(
        page.getByRole("columnheader", { name: "Предмет" }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "Коран", exact: true }).first(),
      ).toBeVisible();

      const altSubject = `Арабский E2E ${Date.now()}`;
      const altGroup = `Группа фильтр ${Date.now()}`;

      await page.goto("/admin/subjects");
      await page.getByRole("button", { name: "Создать предмет" }).click();
      const subjectDialog = page.getByRole("dialog", { name: "Создать предмет" });
      await subjectDialog.getByLabel("Название").fill(altSubject);
      await subjectDialog.getByRole("button", { name: "Создать предмет" }).click();
      await expect(subjectDialog).toBeHidden();

      await page.goto("/groups");
      await page.getByRole("button", { name: "Создать группу" }).click();
      const createDialog = page.getByRole("dialog", { name: "Создать группу" });
      await pickAntdSelectOption(
        page,
        createDialog
          .locator(".ant-form-item")
          .filter({ hasText: "Предмет" })
          .getByRole("combobox"),
        altSubject,
      );
      await createDialog.getByLabel("Название").fill(altGroup);
      await pickAntdSelectOption(
        page,
        createDialog
          .locator(".ant-form-item")
          .filter({ hasText: "Учитель" })
          .getByRole("combobox"),
        TEST_USERS.teacher2Name,
      );
      await createDialog.getByRole("button", { name: "Создать группу" }).click();
      await expect(createDialog).toBeHidden();

      const subjectHeader = page.getByRole("columnheader", { name: "Предмет" });
      await subjectHeader.locator(".ant-table-filter-trigger").click();
      const filter = page.locator(".ant-table-filter-dropdown").last();
      await filter.getByText(altSubject, { exact: true }).click();
      await filter.getByRole("button", { name: "ОК" }).click();

      await expect(
        page.getByRole("cell", { name: altGroup, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: TEST_USERS.group1, exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("cell", { name: TEST_USERS.group2, exact: true }),
      ).toHaveCount(0);
    });
  });

  test.describe("учитель", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("TEACHER не видит /groups — redirect", async ({ page }) => {
      await page.goto("/groups");
      await expect(page).not.toHaveURL(/\/groups/);
      await expect(page).toHaveURL(/\/journal/);
    });
  });
});

test.describe("Группы: зачисление учеников", () => {
  test.use({ storageState: AUTH_STATE.manager });

  test("зачисляет ученика с уровнем на странице группы", async ({ page }) => {
    await page.goto("/groups");
    await page.getByRole("link", { name: TEST_USERS.group1, exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Добавить учеников" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Добавить учеников" }).click();
    const dialog = page.getByRole("dialog", { name: "Зачислить учеников" });
    await expect(dialog).toBeVisible();

    await pickAntdSelectOption(
      page,
      dialog
        .locator(".ant-form-item")
        .filter({ hasText: "Ученики" })
        .getByRole("combobox"),
      TEST_USERS.studentKhalid,
    );

    await pickAntdSelectOption(
      page,
      dialog
        .locator(".ant-form-item")
        .filter({ hasText: "Уровень" })
        .getByRole("combobox"),
      "1й уровень",
    );

    await dialog.getByRole("button", { name: "Зачислить" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("cell", { name: TEST_USERS.studentKhalid, exact: true }),
    ).toBeVisible();
  });

  test("зачисляет нескольких учеников одним действием", async ({ page }) => {
    const groupName = `Группа bulk ${Date.now()}`;

    await page.goto("/groups");
    await page.getByRole("button", { name: "Создать группу" }).click();
    const createDialog = page.getByRole("dialog", { name: "Создать группу" });
    await pickAntdSelectOption(
      page,
      createDialog
        .locator(".ant-form-item")
        .filter({ hasText: "Предмет" })
        .getByRole("combobox"),
      "Коран",
    );
    await createDialog.getByLabel("Название").fill(groupName);
    await pickAntdSelectOption(
      page,
      createDialog
        .locator(".ant-form-item")
        .filter({ hasText: "Учитель" })
        .getByRole("combobox"),
      TEST_USERS.teacher1Name,
    );
    await createDialog.getByRole("button", { name: "Создать группу" }).click();
    await expect(createDialog).toBeHidden();

    await page.getByRole("link", { name: groupName, exact: true }).click();
    await page.getByRole("button", { name: "Добавить учеников" }).click();
    const dialog = page.getByRole("dialog", { name: "Зачислить учеников" });
    await expect(dialog).toBeVisible();

    const studentsCombobox = dialog
      .locator(".ant-form-item")
      .filter({ hasText: "Ученики" })
      .getByRole("combobox");

    await pickAntdSelectOption(page, studentsCombobox, TEST_USERS.studentKhalid);
    await pickAntdSelectOption(page, studentsCombobox, TEST_USERS.studentZayd);

    await pickAntdSelectOption(
      page,
      dialog
        .locator(".ant-form-item")
        .filter({ hasText: "Уровень" })
        .getByRole("combobox"),
      "1й уровень",
    );

    await dialog.getByRole("button", { name: "Зачислить" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("cell", { name: TEST_USERS.studentKhalid, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: TEST_USERS.studentZayd, exact: true }),
    ).toBeVisible();
  });

  test("зачисляет ученика во вторую группу с независимым уровнем", async ({
    page,
  }) => {
    await page.goto("/groups");
    await page.getByRole("link", { name: TEST_USERS.group2, exact: true }).click();

    await page.getByRole("button", { name: "Добавить учеников" }).click();
    const dialog = page.getByRole("dialog", { name: "Зачислить учеников" });
    await pickAntdSelectOption(
      page,
      dialog
        .locator(".ant-form-item")
        .filter({ hasText: "Ученики" })
        .getByRole("combobox"),
      TEST_USERS.studentAli,
    );
    await pickAntdSelectOption(
      page,
      dialog
        .locator(".ant-form-item")
        .filter({ hasText: "Уровень" })
        .getByRole("combobox"),
      "2й уровень",
    );
    await dialog.getByRole("button", { name: "Зачислить" }).click();
    await expect(dialog).toBeHidden();

    const aliInGroup2 = page
      .getByRole("row")
      .filter({ hasText: TEST_USERS.studentAli });
    await expect(aliInGroup2.getByRole("cell").nth(1)).toContainText("2");

    await page.goto("/groups");
    await page.getByRole("link", { name: TEST_USERS.group1, exact: true }).click();
    const aliInGroup1 = page
      .getByRole("row")
      .filter({ hasText: TEST_USERS.studentAli });
    await expect(aliInGroup1.getByRole("cell").nth(1)).toContainText("1");
  });
});
