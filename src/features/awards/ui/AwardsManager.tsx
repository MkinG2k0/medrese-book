'use client'

import { Button, Form, Input, Select, Table } from 'antd'
import { useTransition } from 'react'

import { createAward, deleteAward } from '@/features/awards/actions/award-actions'

type AwardRow = {
	id: string
	studentName: string
	type: string
	title: string
	date: Date
}

type AwardsManagerProps = {
	awards: AwardRow[]
	students: { id: string; name: string }[]
}

export function AwardsManager({ awards, students }: AwardsManagerProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const onFinish = (values: { studentId: string; type: 'STUDY' | 'ACTIVITY'; title: string }) => {
		startTransition(async () => {
			await createAward(values)
			form.resetFields()
		})
	}

	const handleDelete = (id: string) => {
		startTransition(async () => {
			await deleteAward(id)
		})
	}

	return (
		<div className="flex flex-col gap-6">
			<Form form={form} layout="inline" onFinish={onFinish} className="flex flex-wrap gap-2">
				<Form.Item name="studentId" rules={[{ required: true }]}>
					<Select
						placeholder="Ученик"
						style={{ width: 200 }}
						options={students.map((s) => ({ value: s.id, label: s.name }))}
					/>
				</Form.Item>
				<Form.Item name="type" rules={[{ required: true }]}>
					<Select
						placeholder="Тип"
						style={{ width: 140 }}
						options={[
							{ value: 'STUDY', label: 'Учёба' },
							{ value: 'ACTIVITY', label: 'Активность' },
						]}
					/>
				</Form.Item>
				<Form.Item name="title" rules={[{ required: true }]}>
					<Input placeholder="Название награды" />
				</Form.Item>
				<Button type="primary" htmlType="submit" loading={isPending}>
					Добавить
				</Button>
			</Form>

			<Table
				dataSource={awards}
				rowKey="id"
				columns={[
					{ title: 'Ученик', dataIndex: 'studentName', key: 'studentName' },
					{ title: 'Тип', dataIndex: 'type', key: 'type' },
					{ title: 'Название', dataIndex: 'title', key: 'title' },
					{
						title: 'Дата',
						dataIndex: 'date',
						key: 'date',
						render: (d: Date) => new Date(d).toLocaleDateString('ru-RU'),
					},
					{
						title: '',
						key: 'actions',
						render: (_, record) => (
							<Button danger size="small" onClick={() => handleDelete(record.id)}>
								Удалить
							</Button>
						),
					},
				]}
			/>
		</div>
	)
}
