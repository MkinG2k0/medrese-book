'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Form, Input, Modal } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { LeaveRequestListItem } from '@/entities/leave-request/model/types'
import { rejectLeaveRequest } from '@/features/leave-requests/actions/leave-actions'

const rejectFormSchema = z.object({
	rejectionReason: z
		.string()
		.min(5, 'Причина отклонения должна быть не короче 5 символов')
		.max(500, 'Причина отклонения не должна превышать 500 символов'),
})

type RejectFormValues = z.infer<typeof rejectFormSchema>

type RejectLeaveModalProps = {
	request: LeaveRequestListItem | null
	onClose: () => void
}

export function RejectLeaveModal({ request, onClose }: RejectLeaveModalProps) {
	const { message } = App.useApp()
	const queryClient = useQueryClient()
	const [submitting, setSubmitting] = useState(false)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<RejectFormValues>({
		resolver: zodResolver(rejectFormSchema),
		defaultValues: { rejectionReason: '' },
	})

	useEffect(() => {
		if (request) {
			reset({ rejectionReason: '' })
		}
	}, [request, reset])

	const onSubmit = async (values: RejectFormValues) => {
		if (!request) return

		setSubmitting(true)
		try {
			await rejectLeaveRequest({
				leaveRequestId: request.id,
				rejectionReason: values.rejectionReason,
			})
			message.success('Заявка отклонена')
			await queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
			onClose()
		} catch (error) {
			message.error(
				error instanceof Error
					? error.message
					: 'Не удалось отклонить заявку. Попробуйте снова.',
			)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Modal
			title="Отклонить заявку"
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
					danger
					loading={submitting}
					onClick={() => void handleSubmit(onSubmit)()}
				>
					Отклонить
				</Button>,
			]}
		>
			{request && (
				<form
					onSubmit={(event) => {
						event.preventDefault()
						void handleSubmit(onSubmit)()
					}}
					className="flex flex-col gap-4 pt-2"
				>
					<p className="text-sm text-neutral-400">
						Укажите причину отклонения — преподаватель увидит её в уведомлении.
					</p>
					<Form.Item
						label="Причина отклонения"
						validateStatus={errors.rejectionReason ? 'error' : undefined}
						help={errors.rejectionReason?.message}
						required
						className="mb-0"
					>
						<Controller
							name="rejectionReason"
							control={control}
							render={({ field }) => (
								<Input.TextArea
									{...field}
									data-testid="leave-rejection-reason-input"
									rows={3}
									maxLength={500}
									placeholder="Например: в этот период нет замены"
								/>
							)}
						/>
					</Form.Item>
				</form>
			)}
		</Modal>
	)
}
