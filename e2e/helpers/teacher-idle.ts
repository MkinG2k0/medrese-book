import type { BrowserContext, Page } from "@playwright/test";

import {
  signTeacherLastActiveValue,
  TEACHER_IDLE_TIMEOUT_MS,
  TEACHER_LAST_ACTIVE_COOKIE,
} from "../../src/shared/lib/teacher-idle";

export async function readSessionUserId(page: Page): Promise<string | null> {
  const response = await page.request.get("/api/auth/session");
  const body = (await response.json()) as { user?: { id?: string } };
  return body.user?.id ?? null;
}

export async function plantExpiredTeacherLastActiveCookie(
  context: BrowserContext,
  userId: string,
  origin: string,
): Promise<void> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET не задан. Заполните AUTH_SECRET в .env.test.");
  }

  const epochMs = Date.now() - TEACHER_IDLE_TIMEOUT_MS - 1000;
  const value = await signTeacherLastActiveValue(userId, epochMs, secret);

  await context.addCookies([
    {
      name: TEACHER_LAST_ACTIVE_COOKIE,
      value,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    },
  ]);
}
