'use client'

import { App, Form, Modal, Select } from 'antd'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
	listTransferTargetGroups,
	transferStudents,
} from '@/features/groups/actions/group-actions'

type TransferTarget = {
	id: string
	name: string
	teacherName: string
}

type TransferStudentModalProps = {
	open: boolean
	fromGroupId: string
	students: { studentId: string; studentName: string }[]
	onClose: () => void
	onTransferred?: () => void
}

export function TransferStudentModal({
	open,
	fromGroupId,
	students,
	onClose,
	onTransferred,
}: TransferStudentModalProps) {
	const { message } = App.useApp()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [form] = Form.useForm<{ toGroupId: string }>()
	const [targets, setTargets] = useState<TransferTarget[]>([])
	const [loadingTargets, setLoadingTargets] = useState(false)

	useEffect(() => {
		if (!open) {
			form.resetFields()
			return
		}

		let cancelled = false
		setLoadingTargets(true)
		listTransferTargetGroups(fromGroupId)
			.then((result) => {
				if (!cancelled) setTargets(result)
			})
			.catch((err) => {
				if (!cancelled) {
					message.error(
						err instanceof Error
							? err.message
							: 'Не удалось загрузить группы',
					)
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingTargets(false)
			})

		return () => {
			cancelled = true
		}
	}, [open, fromGroupId, form, message])

	const handleOk = () => {
		startTransition(async () => {
			try {
				const values = await form.validateFields()
				await transferStudents(fromGroupId, {
					studentIds: students.map((student) => student.studentId),
					toGroupId: values.toGroupId,
				})
				message.success(
					students.length === 1
						? `«${students[0]?.studentName}» переведён в другую группу`
						: `Переведено учеников: ${students.length}`,
				)
				onTransferred?.()
				onClose()
				router.refresh()
			} catch (err) {
				if (err && typeof err === 'object' && 'errorFields' in err) return
				message.error(
					err instanceof Error ? err.message : 'Не удалось перевести ученика',
				)
			}
		})
	}

	return (
		<Modal
			title={
				students.length === 1
					? `Перевести: ${students[0]?.studentName}`
					: `Перевести учеников: ${students.length}`
			}
			open={open}
			onCancel={onClose}
			onOk={handleOk}
			okText="Перевести"
			cancelText="Отмена"
			confirmLoading={isPending}
			destroyOnHidden
		>
			<Form form={form} layout="vertical" className="mt-4">
				<Form.Item
					name="toGroupId"
					label="Группа того же предмета"
					rules={[{ required: true, message: 'Выберите группу' }]}
				>
					<Select
						placeholder="Выберите группу"
						loading={loadingTargets}
						options={targets.map((group) => ({
							value: group.id,
							label: `${group.name} — ${group.teacherName}`,
						}))}
						notFoundContent={
							loadingTargets
								? 'Загрузка…'
								: 'Нет других групп по этому предмету'
						}
						showSearch
						optionFilterProp="label"
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
