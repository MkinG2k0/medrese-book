import { z } from 'zod'

export function parseUserNames(raw: string): string[] {
	return raw
		.split(/[,\n]/)
		.map((name) => name.trim())
		.filter((name) => name.length > 0)
}

const userRoleSchema = z.enum(['SUPER_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'])

export const createUsersSchema = z
	.object({
		names: z
			.array(z.string().min(2, 'Имя должно быть не короче 2 символов'))
			.min(1, 'Укажите хотя бы одно имя'),
		role: userRoleSchema,
		groupId: z.string().optional(),
	})
	.refine((data) => data.role !== 'STUDENT' || !!data.groupId, {
		message: 'Выберите группу',
		path: ['groupId'],
	})

export const createUserFormSchema = z
	.object({
		names: z.string().min(1, 'Укажите хотя бы одно имя'),
		role: userRoleSchema,
		groupId: z.string().optional(),
	})
	.refine((data) => parseUserNames(data.names).length >= 1, {
		message: 'Укажите хотя бы одно имя',
		path: ['names'],
	})
	.refine(
		(data) => parseUserNames(data.names).every((name) => name.length >= 2),
		{
			message: 'Каждое имя должно быть не короче 2 символов',
			path: ['names'],
		},
	)
	.refine((data) => data.role !== 'STUDENT' || !!data.groupId, {
		message: 'Выберите группу',
		path: ['groupId'],
	})

export type CreateUsersInput = z.infer<typeof createUsersSchema>
export type CreateUserFormInput = z.infer<typeof createUserFormSchema>
