'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Descriptions, Form, Modal, Select, Tag } from 'antd'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import {
	approveLeaveRequest,
	getSubstituteTeacherCandidates,
} from '@/features/leave-requests/actions/leave-actions'
import {
	getLeaveRequestTypeLabel,
} from '@/features/leave-requests/lib/leave-labels'

const LEAVE_TYPE_TAG_COLORS = {
	VACATION: 'blue',
	DAY_OFF: 'orange',
	SICK_LEAVE: 'purple',
} as const

const approveFormSchema = z.object({
	substituteTeacherId: z
		.string()
		.min(1, 'Выберите замещающего преподавателя'),
})

type ApproveFormValues = z.infer<typeof approveFormSchema>

function formatPeriod(startDate: string, endDate: string) {
	const start = dayjs(startDate).format('DD.MM.YYYY')
	const end = dayjs(endDate).format('DD.MM.YYYY')
	return start === end ? start : `${start} — ${end}`
}

type ApproveLeaveModalProps = {
	request: LeaveRequestListItem | null
	onClose: () => void
}

export function ApproveLeaveModal({ request, onClose }: ApproveLeaveModalProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const [submitting, setSubmitting] = useState(false)
	const [candidates, setCandidates] = useState<{ id: string; name: string }[]>(
		[],
	)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ApproveFormValues>({
		resolver: zodResolver(approveFormSchema),
		defaultValues: { substituteTeacherId: '' },
	})

	useEffect(() => {
		if (!request) {
			reset({ substituteTeacherId: '' })
			setCandidates([])
			return
		}

		reset({ substituteTeacherId: '' })
		void getSubstituteTeacherCandidates(request.teacherId)
			.then(setCandidates)
			.catch(() => setCandidates([]))
	}, [request, reset])

	const onSubmit = async (values: ApproveFormValues) => {
		if (!request) return

		setSubmitting(true)
		try {
			await approveLeaveRequest({
				leaveRequestId: request.id,
				substituteTeacherId: values.substituteTeacherId,
			})
			message.success('Заявка подтверждена, замещение активировано')
			await queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
			onClose()
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: 'Не удалось подтвердить заявку. Попробуйте снова.',
			)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Modal
			title="Подтвердить заявку"
			open={request != null}
			onCancel={onClose}
			destroyOnHidden
			width={560}
			footer={[
				<Button key="cancel" onClick={onClose}>
					Отмена
				</Button>,
				<Button
					key="submit"
					type="primary"
					loading={submitting}
					onClick={() => void handleSubmit(onSubmit)()}
				>
					Подтвердить заявку
				</Button>,
			]}
		>
			{request && (
				<div className="flex flex-col gap-4 pt-2">
					<Descriptions column={1} size="small">
						<Descriptions.Item label="Преподаватель">
							{request.teacherName}
						</Descriptions.Item>
						<Descriptions.Item label="Тип">
							<Tag color={LEAVE_TYPE_TAG_COLORS[request.type]}>
								{getLeaveRequestTypeLabel(request.type)}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Период">
							{formatPeriod(request.startDate, request.endDate)}
						</Descriptions.Item>
						<Descriptions.Item label="Описание">
							{request.description}
						</Descriptions.Item>
					</Descriptions>

					<form
						onSubmit={(event) => {
							event.preventDefault()
							void handleSubmit(onSubmit)()
						}}
					>
						<Form.Item
							label="Замещающий преподаватель"
							validateStatus={errors.substituteTeacherId ? 'error' : undefined}
							help={errors.substituteTeacherId?.message}
							required
							className="mb-0"
						>
							<Controller
								name="substituteTeacherId"
								control={control}
								render={({ field }) => (
									<Select
										{...field}
										showSearch
										optionFilterProp="label"
										placeholder="Выберите преподавателя"
										options={candidates.map((teacher) => ({
											value: teacher.id,
											label: teacher.name,
										}))}
									/>
								)}
							/>
						</Form.Item>
					</form>
				</div>
			)}
		</Modal>
	)
}
