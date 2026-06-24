import { z } from 'zod'

export const LEAVE_REQUEST_TYPE_VALUES = [
	'VACATION',
	'DAY_OFF',
	'SICK_LEAVE',
] as const

export const createLeaveRequestSchema = z
	.object({
		type: z.enum(LEAVE_REQUEST_TYPE_VALUES, {
			message: 'Выберите тип заявки',
		}),
		startDate: z.string().datetime({ message: 'Укажите дату начала периода' }),
		endDate: z.string().datetime({ message: 'Укажите дату окончания периода' }),
		description: z
			.string()
			.min(2, 'Описание должно быть не короче 2 символов')
			.max(500, 'Описание не должно превышать 500 символов'),
	})
	.refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
		message: 'Дата окончания не может быть раньше даты начала',
		path: ['endDate'],
	})

export const approveLeaveRequestSchema = z.object({
	leaveRequestId: z.string().min(1, 'Не указана заявка'),
	substituteTeacherId: z
		.string()
		.min(1, 'Выберите замещающего преподавателя'),
})

export const rejectLeaveRequestSchema = z.object({
	leaveRequestId: z.string().min(1, 'Не указана заявка'),
	rejectionReason: z
		.string()
		.min(5, 'Причина отклонения должна быть не короче 5 символов')
		.max(500, 'Причина отклонения не должна превышать 500 символов'),
})

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>
export type ApproveLeaveRequestInput = z.infer<typeof approveLeaveRequestSchema>
export type RejectLeaveRequestInput = z.infer<typeof rejectLeaveRequestSchema>
