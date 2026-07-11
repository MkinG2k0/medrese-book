'use client'

import { App, Form, Modal, Select } from 'antd'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
	enrollStudent,
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

export function EnrollStudentModal({
	groupId,
	subjectId,
	levels,
	open,
	onClose,
}: EnrollStudentModalProps) {
	const { message } = App.useApp()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm()
	const [students, setStudents] = useState<StudentOption[]>([])
	const [loadingStudents, setLoadingStudents] = useState(false)

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

	const handleFinish = (values: { studentId: string; levelId: string }) => {
		startTransition(async () => {
			try {
				await enrollStudent(groupId, values)
				message.success('Ученик зачислен')
				form.resetFields()
				onClose()
				router.refresh()
			} catch (err) {
				message.error(
					err instanceof Error
						? err.message
						: 'Не удалось зачислить ученика',
				)
			}
		})
	}

	return (
		<Modal
			title="Зачислить ученика"
			open={open}
			onCancel={onClose}
			onOk={() => form.submit()}
			okText="Зачислить"
			cancelText="Отмена"
			confirmLoading={isPending}
			destroyOnHidden
		>
			<Form form={form} layout="vertical" onFinish={handleFinish}>
				<Form.Item
					name="studentId"
					label="Ученик"
					rules={[{ required: true, message: 'Выберите ученика' }]}
				>
					<Select
						showSearch
						placeholder="Выберите ученика"
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
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
