import { test, expect } from "@playwright/test";

import {
  apiGetAs,
  apiGetUnauthenticated,
  expectForbidden,
  expectUnauthorized,
  TEST_CODES,
} from "./helpers/api";
import { TEST_USERS } from "./helpers/codes";
import { getGroupIdByName, getStudentIdByCode } from "./helpers/db";

test.describe("API authorization (FND-02)", () => {
  test("401 — unauthenticated GET /api/students returns 401", async () => {
    const groupId = await getGroupIdByName(TEST_USERS.group1);
    const response = await apiGetUnauthenticated(
      `/api/students?groupId=${groupId}`,
    );
    await expectUnauthorized(response);
  });

  test("cross-group — student cannot read foreign group roster", async () => {
    const foreignGroupId = await getGroupIdByName(TEST_USERS.group2);
    const response = await apiGetAs(
      TEST_CODES.studentAli,
      `/api/students?groupId=${foreignGroupId}`,
    );
    await expectForbidden(response);
  });

  test("sessions — student cannot read foreign student sessions without date", async () => {
    const foreignStudentId = await getStudentIdByCode(TEST_CODES.studentKhalid);
    const response = await apiGetAs(
      TEST_CODES.studentAli,
      `/api/sessions?studentId=${foreignStudentId}`,
    );
    await expectForbidden(response);
  });

  test("teacher — can read own group roster", async () => {
    const ownGroupId = await getGroupIdByName(TEST_USERS.group1);
    const response = await apiGetAs(
      TEST_CODES.teacher1,
      `/api/students?groupId=${ownGroupId}`,
    );
    expect(response.status(), "expected HTTP 200 OK").toBe(200);
    const json = (await response.json()) as {
      data: unknown[] | null;
      error: string | null;
    };
    expect(json.error).toBeNull();
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.data!.length).toBeGreaterThan(0);
  });
});
