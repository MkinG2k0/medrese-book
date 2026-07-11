import { expect } from "@playwright/test";

import { TEST_USERS } from "./codes";

export const E2E_GROUP_AL_FATIHA = TEST_USERS.group1;
export const E2E_GROUP_AL_IKHLAS = TEST_USERS.groupTeacher1Second;

export type GotoJournalOptions = {
  groupId?: string;
  date?: string;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildJournalUrl({ groupId, date }: GotoJournalOptions = {}): string {
  const params = new URLSearchParams();
  params.set("date", date ?? todayDateString());
  if (groupId) {
    params.set("groupId", groupId);
  }
  return `/journal?${params.toString()}`;
}

export async function gotoJournal(
  page: import("@playwright/test").Page,
  options: GotoJournalOptions = {},
) {
  await page.goto(buildJournalUrl(options));
}

export async function expectJournalUrlHasGroupId(
  page: import("@playwright/test").Page,
) {
  const url = new URL(page.url());
  await expect(url.searchParams.get("groupId")).toBeTruthy();
}

export async function getJournalGroupIdFromUrl(
  page: import("@playwright/test").Page,
): Promise<string | null> {
  return new URL(page.url()).searchParams.get("groupId");
}

export async function startLessonIfNeeded(page: import("@playwright/test").Page) {
  const startButton = page.getByRole("button", { name: "Начать урок" });
  if (await startButton.isVisible()) {
    await startButton.click();
    await expect(page.getByText("Урок идёт")).toBeVisible();
  }
}
