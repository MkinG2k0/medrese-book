'use client'

import { App, Button, Form, Input } from 'antd'
import { useTransition } from 'react'

import { updateSubject } from '@/features/subject-admin/actions/subject-actions'

type EditSubjectFormProps = {
	subjectId: string
	initialName: string
	initialDescription: string
	onSuccess?: () => void
}

export function EditSubjectForm({
	subjectId,
	initialName,
	initialDescription,
	onSuccess,
}: EditSubjectFormProps) {
	const { message } = App.useApp()
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { name: string; description?: string }) => {
		startTransition(async () => {
			try {
				await updateSubject(subjectId, {
					name: values.name,
					description: values.description ?? '',
				})
				message.success('Изменения сохранены')
				onSuccess?.()
			} catch {
				message.error('Не удалось сохранить. Попробуйте ещё раз.')
			}
		})
	}

	return (
		<Form
			form={form}
			layout="vertical"
			initialValues={{
				name: initialName,
				description: initialDescription || undefined,
			}}
			onFinish={onFinish}
		>
			<Form.Item
				name="name"
				label="Название"
				rules={[
					{ required: true, message: 'Введите название' },
					{ min: 2, message: 'Название должно быть не короче 2 символов' },
				]}
			>
				<Input />
			</Form.Item>
			<Form.Item name="description" label="Описание">
				<Input.TextArea rows={3} />
			</Form.Item>
			<Button type="primary" htmlType="submit" loading={isPending}>
				Сохранить изменения
			</Button>
		</Form>
	)
}
