'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, DatePicker, Form, Input, Modal } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { endOfDay, startOfDay } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { createLeaveRequest } from '@/features/leave-requests/actions/leave-actions'
import type { LeaveRequestType } from '@/shared/lib/prisma'

const { RangePicker } = DatePicker

const createLeaveFormSchema = z.object({
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

type CreateLeaveFormValues = z.infer<typeof createLeaveFormSchema>

const LEAVE_TYPE_TITLES: Record<LeaveRequestType, string> = {
	VACATION: 'Новый отпуск',
	DAY_OFF: 'Новый отгул',
	SICK_LEAVE: 'Новый больничный',
}

type CreateLeaveModalProps = {
	open: boolean
	leaveType: LeaveRequestType
	onClose: () => void
}

export function CreateLeaveModal({
	open,
	leaveType,
	onClose,
}: CreateLeaveModalProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const [submitting, setSubmitting] = useState(false)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateLeaveFormValues>({
		resolver: zodResolver(createLeaveFormSchema),
		defaultValues: {
			dateRange: [dayjs(), dayjs()],
			description: '',
		},
	})

	useEffect(() => {
		if (open) {
			reset({
				dateRange: [dayjs(), dayjs()],
				description: '',
			})
		}
	}, [open, leaveType, reset])

	const onSubmit = async (values: CreateLeaveFormValues) => {
		setSubmitting(true)
		try {
			await createLeaveRequest({
				type: leaveType,
				startDate: startOfDay(values.dateRange[0].toDate()).toISOString(),
				endDate: endOfDay(values.dateRange[1].toDate()).toISOString(),
				description: values.description,
			})
			message.success('Заявка отправлена на согласование')
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

	const title = LEAVE_TYPE_TITLES[leaveType]

	return (
		<Modal
			title={title}
			open={open}
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
					Отправить заявку
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
								inputReadOnly
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
