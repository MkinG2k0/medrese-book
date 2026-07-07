'use client'

import { App, Button, Form, Input, InputNumber } from 'antd'
import { useTransition } from 'react'

import { createLevel } from '@/features/program-admin/actions/program-actions'

type CreateLevelFormProps = {
	subjectId: string
	onSuccess?: () => void
}

export function CreateLevelForm({ subjectId, onSuccess }: CreateLevelFormProps) {
	const { message } = App.useApp()
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { number: number; title: string }) => {
		startTransition(async () => {
			try {
				await createLevel({
					subjectId,
					number: values.number,
					title: values.title,
				})
				message.success('Уровень создан')
				form.resetFields()
				onSuccess?.()
			} catch {
				message.error('Не удалось сохранить. Попробуйте ещё раз.')
			}
		})
	}

	return (
		<Form form={form} layout="vertical" onFinish={onFinish}>
			<Form.Item
				name="number"
				label="Номер уровня"
				rules={[{ required: true, message: 'Введите номер уровня' }]}
			>
				<InputNumber className="w-full" min={1} />
			</Form.Item>
			<Form.Item
				name="title"
				label="Название"
				rules={[{ required: true, message: 'Введите название' }]}
			>
				<Input />
			</Form.Item>
			<Button type="primary" htmlType="submit" loading={isPending}>
				Создать уровень
			</Button>
		</Form>
	)
}
