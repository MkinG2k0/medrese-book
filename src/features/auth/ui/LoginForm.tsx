'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Input } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { getUserInfoByCode } from '@/features/auth/actions/auth-actions'
import {
	addRememberedAccount,
	shouldRememberAccount,
} from '@/features/auth/lib/remembered-accounts-storage'
import { RememberedAccountsSelect } from '@/features/auth/ui/RememberedAccountsSelect'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

const loginSchema = z.object({
	code: z
		.string()
		.transform((value) => value.replace(/\D/g, ''))
		.pipe(
			z
				.string()
				.length(6, 'Код должен содержать 6 цифр')
				.regex(/^\d{6}$/, 'Только цифры'),
		),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const { control, handleSubmit } = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { code: '' },
	})

	const onSubmit = async (values: LoginFormValues) => {
		setLoading(true)
		setError(null)

		const result = await signIn('code', {
			code: values.code,
			redirect: false,
		})

		setLoading(false)

		if (result?.error) {
			setError('Неверный код доступа')
			return
		}

		const user = await getUserInfoByCode(values.code)
		if (user && shouldRememberAccount(user.role)) {
			addRememberedAccount({
				id: user.id,
				name: user.name,
				role: user.role,
				code: values.code,
			})
		}

		router.replace('/dashboard')
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4">
			<Title level={3} className="!mb-0 !text-center">
				Вход в дневник
			</Title>
			<Text type="secondary" className="text-center">
				Введите 6-значный код доступа
			</Text>

			<RememberedAccountsSelect placeholder="Войти как…" />

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
							onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
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

			<Button type="primary" htmlType="submit" size="large" loading={loading} block>
				Войти
			</Button>
		</form>
	)
}
