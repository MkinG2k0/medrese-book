import { z } from 'zod'

import { STUDENT_STATUS_VALUES } from '@/shared/lib/student-status'

export const updateStudentStatusSchema = z.object({
	status: z.enum(STUDENT_STATUS_VALUES),
})

export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>
