"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Input } from "antd";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { loginWithCode } from "@/features/auth/actions/login-actions";
import {
  addRememberedAccount,
  shouldRememberAccount,
} from "@/features/auth/lib/remembered-accounts-storage";
import { RememberedAccountsSelect } from "@/features/auth/ui/RememberedAccountsSelect";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

const loginSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .length(6, "Код должен содержать 6 цифр")
        .regex(/^\d{6}$/, "Только цифры"),
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    const result = await loginWithCode(values.code);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const session = await getSession();
    if (!session) {
      setError("Не удалось создать сессию. Проверьте AUTH_SECRET на сервере.");
      return;
    }

    if (shouldRememberAccount(session.user.role)) {
      addRememberedAccount({
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        code: values.code,
      });
    }
    router.push("/dashboard");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <Title level={3} className="!mb-0 !text-center">
        Вход в дневник
      </Title>
      <Text type="secondary" className="text-center">
        Введите 6-значный код доступа
      </Text>

      {/* <RememberedAccountsSelect placeholder="Войти как…" /> */}

      <Controller
        name="code"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <Input
              {...field}
              maxLength={6}
              placeholder="000000"
              size="large"
              className="text-center tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              type="password"
              onChange={(e) =>
                field.onChange(e.target.value.replace(/\D/g, ""))
              }
            />
            {fieldState.error && (
              <Text type="danger" className="mt-1 block">
                {fieldState.error.message}
              </Text>
            )}
          </div>
        )}
      />

      {error && <Alert type="error" message={error} showIcon />}

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        loading={loading}
        block
      >
        Войти
      </Button>
    </form>
  );
}
