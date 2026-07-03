'use client'

import { Button, Form, Input, Select } from 'antd'
import { useTransition } from 'react'

import { updateGroup } from '@/features/groups/actions/group-actions'

type EditGroupFormProps = {
	groupId: string
	initialName: string
	initialTeacherId: string
	teachers: { id: string; name: string }[]
	onSuccess?: () => void
}

export function EditGroupForm({
	groupId,
	initialName,
	initialTeacherId,
	teachers,
	onSuccess,
}: EditGroupFormProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { name: string; teacherId: string }) => {
		startTransition(async () => {
			await updateGroup(groupId, values)
			onSuccess?.()
		})
	}

	return (
		<Form
			form={form}
			layout="vertical"
			initialValues={{ name: initialName, teacherId: initialTeacherId }}
			onFinish={onFinish}
		>
			<Form.Item
				name="name"
				label="Название"
				rules={[{ required: true, message: 'Введите название' }]}
			>
				<Input />
			</Form.Item>
			<Form.Item
				name="teacherId"
				label="Учитель"
				rules={[{ required: true, message: 'Выберите учителя' }]}
			>
				<Select
					options={teachers.map((t) => ({ value: t.id, label: t.name }))}
				/>
			</Form.Item>
			<Button type="primary" htmlType="submit" loading={isPending}>
				Сохранить
			</Button>
		</Form>
	)
}
