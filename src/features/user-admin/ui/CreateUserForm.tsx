'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Input, Select } from 'antd'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { createUser } from '@/features/user-admin/actions/user-actions'
import { createUserSchema } from '@/shared/lib/validations/user'

type CreateUserFormValues = z.infer<typeof createUserSchema>

type CreateUserFormProps = {
	groups: { id: string; name: string }[]
	onSuccess: (code: string) => void
}

export function CreateUserForm({ groups, onSuccess }: CreateUserFormProps) {
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit, watch } = useForm<CreateUserFormValues>({
		resolver: zodResolver(createUserSchema),
		defaultValues: { name: '', role: 'STUDENT' },
	})

	const role = watch('role')

	const onSubmit = (values: CreateUserFormValues) => {
		startTransition(async () => {
			const result = await createUser(values)
			onSuccess(result.code)
		})
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			<Controller
				name="name"
				control={control}
				render={({ field, fieldState }) => (
					<Form.Item label="Имя" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
						<Input {...field} />
					</Form.Item>
				)}
			/>

			<Controller
				name="role"
				control={control}
				render={({ field }) => (
					<Form.Item label="Роль">
						<Select
							{...field}
							options={[
								{ value: 'TEACHER', label: 'Учитель' },
								{ value: 'STUDENT', label: 'Ученик' },
								{ value: 'MANAGER', label: 'Менеджер' },
							]}
						/>
					</Form.Item>
				)}
			/>

			{role === 'STUDENT' && (
				<Controller
					name="groupId"
					control={control}
					render={({ field, fieldState }) => (
						<Form.Item label="Группа" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
							<Select
								{...field}
								options={groups.map((g) => ({ value: g.id, label: g.name }))}
								placeholder="Выберите группу"
							/>
						</Form.Item>
					)}
				/>
			)}

			<Button type="primary" htmlType="submit" loading={isPending} block>
				Создать
			</Button>
		</form>
	)
}
