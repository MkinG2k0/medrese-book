import { z } from 'zod'

export type ParsedStudentEntry = {
	name: string
	phone?: string
}

export function parseUserNames(raw: string): string[] {
	return parseStudentEntries(raw).map((entry) => entry.name)
}

export function parseStudentEntries(raw: string): ParsedStudentEntry[] {
	return raw
		.split(/[,\n]/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => {
			const dashIndex = line.search(/\s+-\s+/)
			if (dashIndex === -1) {
				return { name: line }
			}

			const name = line.slice(0, dashIndex).trim()
			const phone = line.slice(dashIndex).replace(/^\s*-\s*/, '').trim()
			return { name, phone: phone || undefined }
		})
}

const optionalPhoneSchema = z
	.string()
	.trim()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : undefined))

const optionalTextSchema = z
	.string()
	.trim()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : undefined))

const userRoleSchema = z.enum(['SUPER_ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'])

const createUserEntrySchema = z.object({
	name: z.string().min(2, 'Имя должно быть не короче 2 символов'),
	phone: optionalPhoneSchema,
	guardianPhone: optionalPhoneSchema,
	fullName: optionalTextSchema,
})

export const createUsersSchema = z
	.object({
		entries: z
			.array(createUserEntrySchema)
			.min(1, 'Укажите хотя бы одного пользователя'),
		role: userRoleSchema,
		phone: optionalPhoneSchema,
		groupId: z.string().optional(),
		levelId: z.string().optional(),
		localStepIndex: z.number().int().min(0).optional(),
	})
	.refine((data) => data.role !== 'STUDENT' || !!data.groupId, {
		message: 'Выберите группу',
		path: ['groupId'],
	})

export const createUserFormSchema = z
	.object({
		names: z.string().min(1, 'Укажите хотя бы одно имя'),
		role: userRoleSchema,
		phone: z.string().optional(),
		studentPhone: z.string().optional(),
		guardianPhone: z.string().optional(),
		groupId: z.string().optional(),
		levelId: z.string().optional(),
		localStepIndex: z.number().int().min(0),
	})
	.refine((data) => parseStudentEntries(data.names).length >= 1, {
		message: 'Укажите хотя бы одно имя',
		path: ['names'],
	})
	.refine(
		(data) =>
			parseStudentEntries(data.names).every((entry) => entry.name.length >= 2),
		{
			message: 'Каждое имя должно быть не короче 2 символов',
			path: ['names'],
		},
	)
	.refine((data) => data.role !== 'STUDENT' || !!data.groupId, {
		message: 'Выберите группу',
		path: ['groupId'],
	})
	.refine((data) => data.role !== 'STUDENT' || !!data.levelId, {
		message: 'Выберите уровень',
		path: ['levelId'],
	})

export type CreateUsersInput = z.infer<typeof createUsersSchema>
export type CreateUserFormInput = z.infer<typeof createUserFormSchema>

export function buildCreateUsersPayload(
	values: CreateUserFormInput,
): CreateUsersInput {
	const parsedEntries = parseStudentEntries(values.names)
	const isSingleStudent =
		values.role === 'STUDENT' && parsedEntries.length === 1

	const entries = parsedEntries.map((entry) => ({
		name: entry.name,
		fullName: values.role === 'STUDENT' ? entry.name : undefined,
		phone:
			values.role === 'STUDENT'
				? isSingleStudent
					? values.studentPhone?.trim() || undefined
					: entry.phone
				: undefined,
		guardianPhone:
			values.role === 'STUDENT' && isSingleStudent
				? values.guardianPhone?.trim() || undefined
				: undefined,
	}))

	return {
		entries,
		role: values.role,
		phone:
			values.role !== 'STUDENT' ? values.phone?.trim() || undefined : undefined,
		groupId: values.groupId,
		levelId: values.levelId,
		localStepIndex:
			values.role === 'STUDENT' ? values.localStepIndex : undefined,
	}
}
