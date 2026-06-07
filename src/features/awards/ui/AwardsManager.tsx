'use client'

import { Button, Form, Input, Select, Table } from 'antd'
import { useMemo, useTransition } from 'react'

import { createAward, deleteAward } from '@/features/awards/actions/award-actions'
import { StudentSelectOption } from '@/features/awards/ui/StudentSelectOption'

type AwardRow = {
	id: string
	studentName: string
	type: string
	title: string
	date: Date
}

type StudentOption = {
	id: string
	name: string
	currentStepIdx: number
	absences: number
	lateCount: number
}

type AwardsManagerProps = {
	awards: AwardRow[]
	students: StudentOption[]
}

export function AwardsManager({ awards, students }: AwardsManagerProps) {
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()

	const studentOptions = useMemo(
		() =>
			[...students]
				.sort((a, b) => b.currentStepIdx - a.currentStepIdx)
				.map((s) => ({
					value: s.id,
					label: s.name,
					stepNumber: s.currentStepIdx + 1,
					absences: s.absences,
					lateCount: s.lateCount,
				})),
		[students],
	)

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
						className="min-w-[280px]"
						showSearch
						optionFilterProp="label"
						popupMatchSelectWidth={false}
						styles={{ popup: { root: { minWidth: 360 } } }}
						options={studentOptions}
						optionRender={(option) => (
							<StudentSelectOption
								name={String(option.label)}
								stepNumber={option.data.stepNumber}
								absences={option.data.absences}
								lateCount={option.data.lateCount}
							/>
						)}
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
