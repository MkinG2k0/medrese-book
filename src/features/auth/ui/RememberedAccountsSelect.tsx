"use client";

import { Select } from "antd";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { loginWithCode } from "@/features/auth/actions/login-actions";
import {
  addRememberedAccount,
  getRememberedAccounts,
  type RememberedAccount,
} from "@/features/auth/lib/remembered-accounts-storage";

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "Учитель",
  STUDENT: "Ученик",
};

type RememberedAccountsSelectProps = {
  currentUserId?: string;
  collapsed?: boolean;
  placeholder?: string;
  className?: string;
};

export function RememberedAccountsSelect({
  currentUserId,
  collapsed = false,
  placeholder = "Быстрый вход",
  className,
}: RememberedAccountsSelectProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAccounts = useCallback(() => {
    setAccounts(getRememberedAccounts());
  }, []);

  useEffect(() => {
    refreshAccounts();
    window.addEventListener("remembered-accounts-change", refreshAccounts);
    return () =>
      window.removeEventListener("remembered-accounts-change", refreshAccounts);
  }, [refreshAccounts]);

  const availableAccounts = currentUserId
    ? accounts.filter((account) => account.id !== currentUserId)
    : accounts;

  if (availableAccounts.length === 0) return null;

  const handleSelect = async (userId: string) => {
    const account = accounts.find((item) => item.id === userId);
    if (!account) return;

    setLoading(true);
    const result = await loginWithCode(account.code);
    setLoading(false);

    if (!result.ok) return;

    const session = await getSession();
    if (!session) return;

    addRememberedAccount(account);
    router.push("/dashboard");
  };

  return (
    <Select
      placeholder={collapsed ? "…" : placeholder}
      className={className ?? "w-full"}
      loading={loading}
      disabled={loading}
      value={null}
      options={availableAccounts.map((account) => ({
        value: account.id,
        label: collapsed
          ? account.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
          : `${account.name}${ROLE_LABELS[account.role] ? ` (${ROLE_LABELS[account.role]})` : ""}`,
      }))}
      onChange={handleSelect}
      allowClear={false}
      showSearch={!collapsed}
      optionFilterProp="label"
    />
  );
}
