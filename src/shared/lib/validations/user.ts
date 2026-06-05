import { z } from 'zod'

export const createUserSchema = z.object({
	name: z.string().min(2, 'Имя обязательно'),
	role: z.enum(['SUPER_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']),
	groupId: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
