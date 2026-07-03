'use client'

import { Button, Form, Input } from 'antd'
import { useTransition } from 'react'

import { updateGroup } from '@/features/groups/actions/group-actions'

type RenameGroupFormProps = {
	groupId: string
	initialName: string
	onSuccess?: () => void
}

export function RenameGroupForm({
	groupId,
	initialName,
	onSuccess,
}: RenameGroupFormProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { name: string }) => {
		startTransition(async () => {
			await updateGroup(groupId, values)
			onSuccess?.()
		})
	}

	return (
		<Form
			form={form}
			layout="vertical"
			initialValues={{ name: initialName }}
			onFinish={onFinish}
		>
			<Form.Item
				name="name"
				label="Название"
				rules={[{ required: true, message: 'Введите название' }]}
			>
				<Input />
			</Form.Item>
			<Button type="primary" htmlType="submit" loading={isPending}>
				Сохранить
			</Button>
		</Form>
	)
}
