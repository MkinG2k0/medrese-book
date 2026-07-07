'use client'

import { Button, Form, Input, Select } from 'antd'
import { useTransition } from 'react'

import { createGroup } from '@/features/groups/actions/group-actions'

type CreateGroupFormProps = {
	subjects: { id: string; name: string }[]
	teachers: { id: string; name: string }[]
	onSuccess?: () => void
}

export function CreateGroupForm({
	subjects,
	teachers,
	onSuccess,
}: CreateGroupFormProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: {
		name: string
		teacherId: string
		subjectId: string
	}) => {
		startTransition(async () => {
			await createGroup(values)
			form.resetFields()
			onSuccess?.()
		})
	}

	return (
		<Form form={form} layout="vertical" onFinish={onFinish}>
			<Form.Item
				name="subjectId"
				label="Предмет"
				rules={[{ required: true, message: 'Выберите предмет' }]}
			>
				<Select
					options={subjects.map((subject) => ({
						value: subject.id,
						label: subject.name,
					}))}
				/>
			</Form.Item>
			<Form.Item name="name" label="Название" rules={[{ required: true }]}>
				<Input />
			</Form.Item>
			<Form.Item name="teacherId" label="Учитель" rules={[{ required: true }]}>
				<Select options={teachers.map((t) => ({ value: t.id, label: t.name }))} />
			</Form.Item>
			<Button type="primary" htmlType="submit" loading={isPending}>
				Создать группу
			</Button>
		</Form>
	)
}
