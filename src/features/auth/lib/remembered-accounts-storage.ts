import type { UserRole } from "@/entities/user";

const STORAGE_KEY = "medrese-remembered-accounts";
const MAX_ACCOUNTS = 10;

export type RememberedAccount = {
  id: string;
  name: string;
  role: UserRole;
  code: string;
};

export function shouldRememberAccount(role: UserRole): boolean {
  return role === "TEACHER";
}

function isRememberedAccount(value: unknown): value is RememberedAccount {
  if (typeof value !== "object" || value === null) return false;
  const account = value as RememberedAccount;
  return (
    typeof account.id === "string" &&
    typeof account.name === "string" &&
    typeof account.role === "string" &&
    typeof account.code === "string"
  );
}

function normalizeRememberedAccounts(
  accounts: RememberedAccount[],
): RememberedAccount[] {
  const seenCodes = new Set<string>();
  const normalized: RememberedAccount[] = [];

  for (const account of accounts) {
    if (!shouldRememberAccount(account.role)) continue;
    if (seenCodes.has(account.code)) continue;
    seenCodes.add(account.code);
    normalized.push(account);
  }

  return normalized.slice(0, MAX_ACCOUNTS);
}

export function getRememberedAccounts(): RememberedAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const valid = parsed.filter(isRememberedAccount);
    const normalized = normalizeRememberedAccounts(valid);

    if (JSON.stringify(normalized) !== JSON.stringify(valid)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    return [];
  }
}

export function addRememberedAccount(account: RememberedAccount): void {
  if (!shouldRememberAccount(account.role)) return;

  const existing = getRememberedAccounts().filter(
    (item) => item.code !== account.code,
  );
  const updated = normalizeRememberedAccounts([account, ...existing]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("remembered-accounts-change"));
}
