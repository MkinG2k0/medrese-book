'use client'

import { App, Form, Modal, Select } from 'antd'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
	enrollStudents,
	searchStudentsForEnroll,
} from '@/features/groups/actions/group-actions'
import type { LevelOption } from '@/features/user-admin/lib/map-users-to-details'

type EnrollStudentModalProps = {
	groupId: string
	subjectId: string
	levels: LevelOption[]
	open: boolean
	onClose: () => void
}

type StudentOption = { id: string; name: string }

function getStepOffset(levels: LevelOption[], levelNumber: number): number {
	let offset = 0
	for (const level of levels) {
		if (level.number >= levelNumber) break
		offset += level.steps.length
	}
	return offset
}

export function EnrollStudentModal({
	groupId,
	levels,
	open,
	onClose,
}: EnrollStudentModalProps) {
	const { message } = App.useApp()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm<{
		studentIds: string[]
		levelId: string
		localStepIndex: number
	}>()
	const [students, setStudents] = useState<StudentOption[]>([])
	const [loadingStudents, setLoadingStudents] = useState(false)

	const levelId = Form.useWatch('levelId', form)
	const selectedLevel = levels.find((level) => level.id === levelId)

	const stepOptions = useMemo(() => {
		if (!selectedLevel) return []
		const offset = getStepOffset(levels, selectedLevel.number)
		return selectedLevel.steps.map((step, index) => ({
			value: index,
			label: `Шаг ${offset + index + 1}: ${step.title}`,
		}))
	}, [levels, selectedLevel])

	useEffect(() => {
		if (!open) {
			form.resetFields()
			return
		}

		let cancelled = false
		setLoadingStudents(true)
		searchStudentsForEnroll(groupId)
			.then((result) => {
				if (!cancelled) setStudents(result)
			})
			.catch((err) => {
				if (!cancelled) {
					message.error(
						err instanceof Error
							? err.message
							: 'Не удалось загрузить учеников',
					)
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingStudents(false)
			})

		return () => {
			cancelled = true
		}
	}, [open, groupId, form, message])

	const handleSearch = (query: string) => {
		searchStudentsForEnroll(groupId, query)
			.then(setStudents)
			.catch((err) => {
				message.error(
					err instanceof Error ? err.message : 'Не удалось найти учеников',
				)
			})
	}

	const handleFinish = (values: {
		studentIds: string[]
		levelId: string
		localStepIndex: number
	}) => {
		startTransition(async () => {
			try {
				await enrollStudents(groupId, values)
				const count = values.studentIds.length
				message.success(
					count === 1
						? 'Ученик зачислен'
						: `Зачислено учеников: ${count}`,
				)
				form.resetFields()
				onClose()
				router.refresh()
			} catch (err) {
				message.error(
					err instanceof Error
						? err.message
						: 'Не удалось зачислить учеников',
				)
			}
		})
	}

	return (
		<Modal
			title="Зачислить учеников"
			open={open}
			onCancel={onClose}
			onOk={() => form.submit()}
			okText="Зачислить"
			cancelText="Отмена"
			confirmLoading={isPending}
			destroyOnHidden
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleFinish}
				initialValues={{ studentIds: [], localStepIndex: 0 }}
			>
				<Form.Item
					name="studentIds"
					label="Ученики"
					rules={[
						{
							required: true,
							type: 'array',
							min: 1,
							message: 'Выберите хотя бы одного ученика',
						},
					]}
				>
					<Select
						mode="multiple"
						showSearch
						placeholder="Выберите учеников"
						loading={loadingStudents}
						filterOption={false}
						onSearch={handleSearch}
						options={students.map((student) => ({
							value: student.id,
							label: student.name,
						}))}
					/>
				</Form.Item>
				<Form.Item
					name="levelId"
					label="Уровень"
					rules={[{ required: true, message: 'Выберите уровень' }]}
				>
					<Select
						placeholder="Выберите уровень"
						options={levels.map((level) => ({
							value: level.id,
							label: `${level.number}й уровень — ${level.title}`,
						}))}
						onChange={() => form.setFieldValue('localStepIndex', 0)}
					/>
				</Form.Item>
				<Form.Item
					name="localStepIndex"
					label="Текущий шаг"
					rules={[{ required: true, message: 'Выберите шаг' }]}
				>
					<Select
						placeholder="Выберите шаг"
						disabled={!selectedLevel}
						options={stepOptions}
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
