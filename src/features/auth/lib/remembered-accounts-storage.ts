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
  return role !== "SUPER_ADMIN" && role !== "MANAGER";
}

export function getRememberedAccounts(): RememberedAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RememberedAccount[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (account) =>
        typeof account.id === "string" &&
        typeof account.name === "string" &&
        typeof account.role === "string" &&
        typeof account.code === "string" &&
        shouldRememberAccount(account.role),
    );
  } catch {
    return [];
  }
}

export function addRememberedAccount(account: RememberedAccount): void {
  if (!shouldRememberAccount(account.role)) return;

  const existing = getRememberedAccounts().filter(
    (item) => item.id !== account.id,
  );
  const updated = [account, ...existing].slice(0, MAX_ACCOUNTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("remembered-accounts-change"));
}
