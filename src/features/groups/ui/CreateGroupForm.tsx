'use client'

import { Button, Form, Input, Select } from 'antd'
import { useTransition } from 'react'

import { createGroup } from '@/features/groups/actions/group-actions'

type CreateGroupFormProps = {
	teachers: { id: string; name: string }[]
	levels: { id: string; title: string }[]
}

export function CreateGroupForm({ teachers, levels }: CreateGroupFormProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { name: string; teacherId: string; levelId: string }) => {
		startTransition(async () => {
			await createGroup(values)
			form.resetFields()
		})
	}

	return (
		<Form form={form} layout="vertical" onFinish={onFinish} className="max-w-md">
			<Form.Item name="name" label="Название" rules={[{ required: true }]}>
				<Input />
			</Form.Item>
			<Form.Item name="teacherId" label="Учитель" rules={[{ required: true }]}>
				<Select options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
			</Form.Item>
			<Form.Item name="levelId" label="Уровень" rules={[{ required: true }]}>
				<Select options={levels.map((l) => ({ value: l.id, label: l.title }))} />
			</Form.Item>
			<Button type="primary" htmlType="submit" loading={isPending}>
				Создать группу
			</Button>
		</Form>
	)
}
