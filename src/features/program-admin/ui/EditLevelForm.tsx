'use client'

import { App, Button, Form, Input, InputNumber } from 'antd'
import { useTransition } from 'react'

import { updateLevel } from '@/features/program-admin/actions/program-actions'

type EditLevelFormProps = {
	subjectId: string
	levelId: string
	initialNumber: number
	initialTitle: string
	onSuccess?: () => void
}

export function EditLevelForm({
	subjectId,
	levelId,
	initialNumber,
	initialTitle,
	onSuccess,
}: EditLevelFormProps) {
	const { message } = App.useApp()
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { number: number; title: string }) => {
		startTransition(async () => {
			try {
				await updateLevel(levelId, {
					subjectId,
					number: values.number,
					title: values.title,
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
			initialValues={{ number: initialNumber, title: initialTitle }}
			onFinish={onFinish}
		>
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
				Сохранить изменения
			</Button>
		</Form>
	)
}
