import {
  expect,
  request,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";

import { TEST_CODES } from "./codes";

function getBaseURL(): string {
  const port = process.env.PLAYWRIGHT_PORT ?? "3001";
  return process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
}

async function loginRequestContext(
  baseURL: string,
  code: string,
): Promise<APIRequestContext> {
  const context = await request.newContext({ baseURL });

  const csrfResponse = await context.get("/api/auth/csrf");
  expect(csrfResponse.ok(), "failed to fetch CSRF token").toBeTruthy();
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const signInResponse = await context.post("/api/auth/callback/code", {
    form: {
      csrfToken,
      code,
      callbackUrl: baseURL,
      json: "true",
    },
  });
  expect(signInResponse.ok(), `login failed for code ${code}`).toBeTruthy();

  return context;
}

const contextCache = new Map<string, APIRequestContext>();

export async function createAuthenticatedContext(
  code: string,
): Promise<APIRequestContext> {
  const cached = contextCache.get(code);
  if (cached) return cached;

  const context = await loginRequestContext(getBaseURL(), code);
  contextCache.set(code, context);
  return context;
}

export async function apiGetAs(
  code: string,
  path: string,
): Promise<APIResponse> {
  const context = await createAuthenticatedContext(code);
  return context.get(path);
}

export async function apiPostAs(
  code: string,
  path: string,
  body?: unknown,
): Promise<APIResponse> {
  const context = await createAuthenticatedContext(code);
  return context.post(path, {
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

export async function apiGetUnauthenticated(path: string): Promise<APIResponse> {
  const context = await request.newContext({ baseURL: getBaseURL() });
  return context.get(path);
}

export async function expectForbidden(response: APIResponse): Promise<void> {
  expect(response.status(), "expected HTTP 403 Forbidden").toBe(403);
  const json = (await response.json().catch(() => null)) as {
    error?: string | null;
  } | null;
  if (json && "error" in json) {
    expect(json.error).toBeTruthy();
  }
}

export async function expectUnauthorized(response: APIResponse): Promise<void> {
  expect(response.status(), "expected HTTP 401 Unauthorized").toBe(401);
  const json = (await response.json().catch(() => null)) as {
    error?: string | null;
  } | null;
  if (json && "error" in json) {
    expect(json.error).toBeTruthy();
  }
}

export { TEST_CODES };
