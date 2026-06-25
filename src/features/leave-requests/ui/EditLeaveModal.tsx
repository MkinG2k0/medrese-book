'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { endOfDay, startOfDay } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import { updateLeaveRequest } from '@/features/leave-requests/actions/leave-actions'
import { LEAVE_REQUEST_TYPE_LABELS } from '@/features/leave-requests/lib/leave-labels'
import type { LeaveRequestType } from '@/shared/lib/prisma'

const { RangePicker } = DatePicker

const editLeaveFormSchema = z.object({
	type: z.custom<LeaveRequestType>((value) => typeof value === 'string', {
		message: 'Выберите тип заявки',
	}),
	dateRange: z
		.tuple([
			z.custom<Dayjs>((value) => dayjs.isDayjs(value), {
				message: 'Укажите дату начала периода',
			}),
			z.custom<Dayjs>((value) => dayjs.isDayjs(value), {
				message: 'Укажите дату окончания периода',
			}),
		])
		.refine(
			([start, end]) => !end.isBefore(start, 'day'),
			{
				message: 'Дата окончания не может быть раньше даты начала',
				path: ['dateRange'],
			},
		),
	description: z
		.string()
		.min(2, 'Описание должно быть не короче 2 символов')
		.max(500, 'Описание не должно превышать 500 символов'),
})

type EditLeaveFormValues = z.infer<typeof editLeaveFormSchema>

type EditLeaveModalProps = {
	request: LeaveRequestListItem | null
	onClose: () => void
}

export function EditLeaveModal({ request, onClose }: EditLeaveModalProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const [submitting, setSubmitting] = useState(false)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<EditLeaveFormValues>({
		resolver: zodResolver(editLeaveFormSchema),
		defaultValues: {
			type: 'DAY_OFF',
			dateRange: [dayjs(), dayjs()],
			description: '',
		},
	})

	useEffect(() => {
		if (request) {
			reset({
				type: request.type,
				dateRange: [
					dayjs(request.startDate),
					dayjs(request.endDate),
				],
				description: request.description,
			})
		}
	}, [request, reset])

	const onSubmit = async (values: EditLeaveFormValues) => {
		if (!request) return

		setSubmitting(true)
		try {
			await updateLeaveRequest({
				leaveRequestId: request.id,
				type: values.type,
				startDate: startOfDay(values.dateRange[0].toDate()).toISOString(),
				endDate: endOfDay(values.dateRange[1].toDate()).toISOString(),
				description: values.description,
			})
			message.success(
				request.status === 'REJECTED'
					? 'Заявка изменена и снова отправлена на согласование'
					: 'Заявка обновлена',
			)
			await queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
			onClose()
		} catch {
			message.error(
				'Не удалось сохранить заявку. Проверьте даты и описание и попробуйте снова.',
			)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Modal
			title="Редактировать заявку"
			open={request != null}
			onCancel={onClose}
			destroyOnHidden
			width={480}
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
					Сохранить и отправить
				</Button>,
			]}
		>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					void handleSubmit(onSubmit)()
				}}
				className="flex flex-col gap-4 pt-2"
			>
				<Form.Item
					label="Тип"
					validateStatus={errors.type ? 'error' : undefined}
					help={errors.type?.message}
					required
					className="mb-0"
				>
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<Select
								{...field}
								options={Object.entries(LEAVE_REQUEST_TYPE_LABELS).map(
									([value, label]) => ({ value, label }),
								)}
							/>
						)}
					/>
				</Form.Item>

				<Form.Item
					label="Период отсутствия"
					validateStatus={errors.dateRange ? 'error' : undefined}
					help={errors.dateRange?.message}
					required
					className="mb-0"
				>
					<Controller
						name="dateRange"
						control={control}
						render={({ field }) => (
							<RangePicker
								{...field}
								value={field.value}
								format="DD.MM.YYYY"
								allowClear={false}
								className="w-full"
								onChange={(dates) => {
									if (!dates?.[0]) return
									field.onChange([
										dates[0],
										dates[1] ?? dates[0],
									] as [Dayjs, Dayjs])
								}}
							/>
						)}
					/>
				</Form.Item>

				<Form.Item
					label="Описание"
					validateStatus={errors.description ? 'error' : undefined}
					help={errors.description?.message}
					required
					className="mb-0"
				>
					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<Input.TextArea
								{...field}
								data-testid="leave-description-input"
								rows={3}
								maxLength={500}
								showCount
								placeholder="Причина или комментарий для менеджера"
							/>
						)}
					/>
				</Form.Item>
			</form>
		</Modal>
	)
}
