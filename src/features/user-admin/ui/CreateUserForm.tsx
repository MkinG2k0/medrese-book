'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Input, Select } from 'antd'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { createUsers } from '@/features/user-admin/actions/user-actions'
import {
	createUserFormSchema,
	parseUserNames,
	type CreateUserFormInput,
} from '@/shared/lib/validations/user'

type CreateUserFormProps = {
	groups: { id: string; name: string }[]
	onSuccess: (users: { name: string; code: string }[]) => void
}

export function CreateUserForm({ groups, onSuccess }: CreateUserFormProps) {
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit, watch } = useForm<CreateUserFormInput>({
		resolver: zodResolver(createUserFormSchema),
		defaultValues: { names: '', role: 'STUDENT' },
	})

	const role = watch('role')

	const onSubmit = (values: CreateUserFormInput) => {
		startTransition(async () => {
			const result = await createUsers({
				names: parseUserNames(values.names),
				role: values.role,
				groupId: values.groupId,
			})
			onSuccess(result.users)
		})
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			<Controller
				name="names"
				control={control}
				render={({ field, fieldState }) => (
					<Form.Item
						label="Имена"
						validateStatus={fieldState.error ? 'error' : ''}
						help={fieldState.error?.message ?? 'Через запятую или с новой строки'}
					>
						<Input.TextArea
							{...field}
							rows={4}
							placeholder={'Магомед, Амина\nПатимат'}
						/>
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
