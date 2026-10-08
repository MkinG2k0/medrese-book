import { z } from 'zod'

import { STUDENT_STATUS_VALUES } from '@/shared/lib/student-status'

export const updateStudentStatusSchema = z.object({
	status: z.enum(STUDENT_STATUS_VALUES),
	groupId: z.string().min(1).optional(),
})

export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>
