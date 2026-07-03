'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Input, Select } from 'antd'
import { useEffect, useMemo, useTransition } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { createUsers } from '@/features/user-admin/actions/user-actions'
import {
	buildCreateUsersPayload,
	createUserFormSchema,
	parseStudentEntries,
	type CreateUserFormInput,
} from '@/shared/lib/validations/user'

type LevelOption = {
	id: string
	number: number
	title: string
	steps: { id: string; order: number; title: string }[]
}

type CreateUserFormProps = {
	groups: { id: string; name: string }[]
	levels: LevelOption[]
	onSuccess: (users: { name: string; code: string }[]) => void
}

function getStepOffset(levels: LevelOption[], levelNumber: number): number {
	let offset = 0
	for (const level of levels) {
		if (level.number >= levelNumber) break
		offset += level.steps.length
	}
	return offset
}

export function CreateUserForm({ groups, levels, onSuccess }: CreateUserFormProps) {
	const [isPending, startTransition] = useTransition()
	const defaultLevelId = levels[0]?.id ?? ''

	const { control, handleSubmit, setValue } = useForm<CreateUserFormInput>({
		resolver: zodResolver(createUserFormSchema),
		defaultValues: {
			names: '',
			role: 'STUDENT',
			phone: '',
			studentPhone: '',
			guardianName: '',
			guardianPhone: '',
			levelId: defaultLevelId,
			localStepIndex: 0,
		},
	})

	const role = useWatch({ control, name: 'role' })
	const names = useWatch({ control, name: 'names' })
	const levelId = useWatch({ control, name: 'levelId' })
	const localStepIndex = useWatch({ control, name: 'localStepIndex' })

	const parsedEntries = useMemo(
		() => parseStudentEntries(names ?? ''),
		[names],
	)
	const isSingleStudent = role === 'STUDENT' && parsedEntries.length === 1
	const isMultipleStudents = role === 'STUDENT' && parsedEntries.length > 1

	const selectedLevel = levels.find((level) => level.id === levelId)

	useEffect(() => {
		if (!selectedLevel) return
		if (localStepIndex > selectedLevel.steps.length) {
			setValue('localStepIndex', selectedLevel.steps.length)
		}
	}, [selectedLevel, localStepIndex, setValue])

	const stepOptions = useMemo(() => {
		if (!selectedLevel) return []
		const offset = getStepOffset(levels, selectedLevel.number)
		return selectedLevel.steps.map((step, index) => ({
			value: index,
			label: `Шаг ${offset + index + 1}: ${step.title}`,
		}))
	}, [levels, selectedLevel])

	const onSubmit = (values: CreateUserFormInput) => {
		startTransition(async () => {
			const result = await createUsers(buildCreateUsersPayload(values))
			onSuccess(result.users)
		})
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			<Controller
				name="names"
				control={control}
				render={({ field, fieldState }) => (
					<Form.Item
						label={role === 'STUDENT' ? 'ФИО' : 'Имена'}
						validateStatus={fieldState.error ? 'error' : ''}
						help={
							fieldState.error?.message ??
							(role === 'STUDENT'
								? isMultipleStudents
									? 'Каждый ученик с новой строки: Имя - телефон'
									: 'ФИО ученика'
								: 'Через запятую или с новой строки')
						}
					>
						<Input.TextArea
							{...field}
							rows={4}
							placeholder={
								role === 'STUDENT' && isMultipleStudents
									? 'Камал - 89676123456\nЗака - 89676789012'
									: role === 'STUDENT'
										? 'Ибрагимов Камал Ахмедович'
										: 'Магомед, Амина\nПатимат'
							}
						/>
					</Form.Item>
				)}
			/>

			<Controller
				name="role"
				control={control}
				render={({ field }) => (
					<Form.Item label="Роль">
						<Select
							{...field}
							options={[
								{ value: 'TEACHER', label: 'Учитель' },
								{ value: 'STUDENT', label: 'Ученик' },
								{ value: 'MANAGER', label: 'Менеджер' },
								{ value: 'ACCOUNTANT', label: 'Бухгалтер' },
							]}
						/>
					</Form.Item>
				)}
			/>

			{role !== 'STUDENT' && (
				<Controller
					name="phone"
					control={control}
					render={({ field }) => (
						<Form.Item label="Телефон">
							<Input {...field} placeholder="89676123456" />
						</Form.Item>
					)}
				/>
			)}

			{role === 'STUDENT' && (
				<>
					<Controller
						name="studentPhone"
						control={control}
						render={({ field }) => (
							<Form.Item
								label="Телефон ученика"
								help={isMultipleStudents ? 'Укажите телефоны в поле ФИО' : undefined}
							>
								<Input
									{...field}
									disabled={isMultipleStudents}
									placeholder="89676123456"
								/>
							</Form.Item>
						)}
					/>

					<Controller
						name="guardianName"
						control={control}
						render={({ field }) => (
							<Form.Item label="Имя опекуна">
								<Input
									{...field}
									disabled={isMultipleStudents}
									placeholder="Ибрагимов Камал Ахмедович"
								/>
							</Form.Item>
						)}
					/>

					<Controller
						name="guardianPhone"
						control={control}
						render={({ field }) => (
							<Form.Item label="Телефон опекуна">
								<Input
									{...field}
									disabled={isMultipleStudents}
									placeholder="89676123456"
								/>
							</Form.Item>
						)}
					/>

					<Controller
						name="groupId"
						control={control}
						render={({ field, fieldState }) => (
							<Form.Item
								label="Группа"
								validateStatus={fieldState.error ? 'error' : ''}
								help={fieldState.error?.message}
							>
								<Select
									{...field}
									options={groups.map((g) => ({ value: g.id, label: g.name }))}
									placeholder="Выберите группу"
								/>
							</Form.Item>
						)}
					/>

					<Controller
						name="levelId"
						control={control}
						render={({ field, fieldState }) => (
							<Form.Item
								label="Уровень"
								validateStatus={fieldState.error ? 'error' : ''}
								help={fieldState.error?.message}
							>
								<Select
									{...field}
									onChange={(value) => {
										field.onChange(value)
										setValue('localStepIndex', 0)
									}}
									options={levels.map((level) => ({
										value: level.id,
										label: `Уровень ${level.number}: ${level.title}`,
									}))}
								/>
							</Form.Item>
						)}
					/>

					<Controller
						name="localStepIndex"
						control={control}
						render={({ field, fieldState }) => (
							<Form.Item
								label="Текущий шаг"
								validateStatus={fieldState.error ? 'error' : ''}
								help={fieldState.error?.message}
							>
								<Select
									{...field}
									options={stepOptions}
									disabled={!selectedLevel}
								/>
							</Form.Item>
						)}
					/>
				</>
			)}

			<Button type="primary" htmlType="submit" loading={isPending} block>
				Создать
			</Button>
		</form>
	)
}
