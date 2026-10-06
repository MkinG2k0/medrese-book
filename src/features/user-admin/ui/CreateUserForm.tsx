'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Input, Select } from 'antd'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import {
	createUsers,
	getLevelsWithStepsForSubject,
	searchParents,
	searchStudentsForParent,
} from '@/features/user-admin/actions/user-actions'
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

type ParentOption = {
	id: string
	name: string
	phone: string | null
	childrenCount: number
}

type StudentOption = {
	id: string
	name: string
	groupName: string | null
}

type CreateUserFormProps = {
	groups: { id: string; name: string; subjectId: string }[]
	onSuccess: (users: { name: string; code: string; role?: string }[]) => void
}

function getStepOffset(levels: LevelOption[], levelNumber: number): number {
	let offset = 0
	for (const level of levels) {
		if (level.number >= levelNumber) break
		offset += level.steps.length
	}
	return offset
}

export function CreateUserForm({ groups, onSuccess }: CreateUserFormProps) {
	const [isPending, startTransition] = useTransition()
	const [levels, setLevels] = useState<LevelOption[]>([])
	const [levelsLoading, setLevelsLoading] = useState(false)
	const [parents, setParents] = useState<ParentOption[]>([])
	const [parentsLoading, setParentsLoading] = useState(false)
	const [students, setStudents] = useState<StudentOption[]>([])
	const [studentsLoading, setStudentsLoading] = useState(false)
	const [selectedStudents, setSelectedStudents] = useState<StudentOption[]>([])

	const { control, handleSubmit, setValue } = useForm<CreateUserFormInput>({
		resolver: zodResolver(createUserFormSchema),
		defaultValues: {
			names: '',
			role: 'STUDENT',
			phone: '',
			studentPhone: '',
			parentId: undefined,
			guardianName: '',
			guardianPhone: '',
			localStepIndex: 0,
			studentIds: [],
		},
	})

	const role = useWatch({ control, name: 'role' })
	const names = useWatch({ control, name: 'names' })
	const groupId = useWatch({ control, name: 'groupId' })
	const levelId = useWatch({ control, name: 'levelId' })
	const localStepIndex = useWatch({ control, name: 'localStepIndex' })
	const parentId = useWatch({ control, name: 'parentId' })

	const parsedEntries = useMemo(
		() => parseStudentEntries(names ?? ''),
		[names],
	)
	const isMultipleStudents = role === 'STUDENT' && parsedEntries.length > 1
	const isMultipleParents = role === 'PARENT' && parsedEntries.length > 1
	const parentLocked = Boolean(parentId)
	const studentOptions = useMemo(() => {
		const byId = new Map(students.map((student) => [student.id, student]))
		for (const selected of selectedStudents) {
			if (!byId.has(selected.id)) byId.set(selected.id, selected)
		}
		return [...byId.values()]
	}, [students, selectedStudents])

	const selectedGroup = groups.find((group) => group.id === groupId)
	const selectedLevel = levels.find((level) => level.id === levelId)

	useEffect(() => {
		if (role !== 'STUDENT') return

		let cancelled = false
		setParentsLoading(true)
		searchParents()
			.then((result) => {
				if (!cancelled) setParents(result)
			})
			.finally(() => {
				if (!cancelled) setParentsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [role])

	useEffect(() => {
		if (role !== 'PARENT') {
			setStudents([])
			setSelectedStudents([])
			setValue('studentIds', [])
			return
		}

		let cancelled = false
		setStudentsLoading(true)
		searchStudentsForParent()
			.then((result) => {
				if (!cancelled) setStudents(result)
			})
			.finally(() => {
				if (!cancelled) setStudentsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [role, setValue])

	useEffect(() => {
		if (role !== 'STUDENT' || !selectedGroup) {
			setLevels([])
			setValue('levelId', undefined)
			return
		}

		let cancelled = false
		setLevelsLoading(true)

		getLevelsWithStepsForSubject(selectedGroup.subjectId)
			.then((loadedLevels) => {
				if (cancelled) return

				const levelOptions = loadedLevels.map((level) => ({
					id: level.id,
					number: level.number,
					title: level.title,
					steps: level.steps.map((step) => ({
						id: step.id,
						order: step.order,
						title: step.title,
					})),
				}))

				setLevels(levelOptions)
				const defaultLevelId = levelOptions[0]?.id
				setValue('levelId', defaultLevelId)
				setValue('localStepIndex', 0)
			})
			.finally(() => {
				if (!cancelled) setLevelsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [role, selectedGroup, setValue])

	useEffect(() => {
		if (!selectedLevel) return
		if (localStepIndex > selectedLevel.steps.length) {
			setValue('localStepIndex', selectedLevel.steps.length)
		}
	}, [selectedLevel, localStepIndex, setValue])

	useEffect(() => {
		if (!parentLocked) return
		setValue('guardianName', '')
		setValue('guardianPhone', '')
	}, [parentLocked, setValue])

	useEffect(() => {
		if (!isMultipleParents) return
		setValue('studentIds', [])
		setSelectedStudents([])
	}, [isMultipleParents, setValue])

	const stepOptions = useMemo(() => {
		if (!selectedLevel) return []
		const offset = getStepOffset(levels, selectedLevel.number)
		return selectedLevel.steps.map((step, index) => ({
			value: index,
			label: `Шаг ${offset + index + 1}: ${step.title}`,
		}))
	}, [levels, selectedLevel])

	const handleParentSearch = (query: string) => {
		searchParents(query)
			.then(setParents)
			.catch(() => undefined)
	}

	const handleStudentSearch = (query: string) => {
		searchStudentsForParent(query)
			.then(setStudents)
			.catch(() => undefined)
	}

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
						label={role === 'STUDENT' || role === 'PARENT' ? 'ФИО' : 'Имена'}
						validateStatus={fieldState.error ? 'error' : ''}
						help={
							fieldState.error?.message ??
							(role === 'STUDENT'
								? isMultipleStudents
									? 'Каждый ученик с новой строки: Имя - телефон'
									: 'ФИО ученика'
								: role === 'PARENT'
									? isMultipleParents
										? 'Через запятую или с новой строки'
										: 'ФИО опекуна'
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
										: role === 'PARENT'
											? 'Ибрагимова Амина'
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
								{ value: 'PARENT', label: 'Опекун' },
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

			{role === 'PARENT' && (
				<Controller
					name="studentIds"
					control={control}
					render={({ field }) => (
						<Form.Item
							label="Ученики"
							help={
								isMultipleParents
									? 'Прикрепить учеников можно только при создании одного опекуна'
									: 'Необязательно — можно прикрепить существующих учеников сразу'
							}
						>
							<Select
								{...field}
								mode="multiple"
								allowClear
								showSearch
								filterOption={false}
								disabled={isMultipleParents}
								loading={studentsLoading}
								placeholder="Поиск ученика по имени"
								value={field.value ?? []}
								onChange={(value: string[]) => {
									field.onChange(value)
									setSelectedStudents((current) => {
										const byId = new Map(
											[...studentOptions, ...current].map((student) => [
												student.id,
												student,
											]),
										)
										return value
											.map((id) => byId.get(id))
											.filter((student): student is StudentOption =>
												Boolean(student),
											)
									})
								}}
								onSearch={handleStudentSearch}
								options={studentOptions.map((student) => ({
									value: student.id,
									label: `${student.name}${student.groupName ? ` · ${student.groupName}` : ''}`,
								}))}
								notFoundContent={
									studentsLoading ? 'Загрузка…' : 'Ученики не найдены'
								}
							/>
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
								help={
									isMultipleStudents
										? 'Укажите телефоны в поле ФИО'
										: undefined
								}
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
						name="parentId"
						control={control}
						render={({ field }) => (
							<Form.Item
								label="Опекун"
								help="Выберите существующего или оставьте пустым и заполните поля ниже"
							>
								<Select
									allowClear
									showSearch
									filterOption={false}
									loading={parentsLoading}
									placeholder="Поиск опекуна по имени или телефону"
									value={field.value || undefined}
									onChange={(value) => field.onChange(value ?? undefined)}
									onSearch={handleParentSearch}
									onClear={() => field.onChange(undefined)}
									options={parents.map((parent) => ({
										value: parent.id,
										label: `${parent.name}${parent.phone ? ` · ${parent.phone}` : ''} (${parent.childrenCount})`,
									}))}
									notFoundContent={
										parentsLoading ? 'Загрузка…' : 'Опекуны не найдены'
									}
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
									disabled={parentLocked}
									placeholder="Ибрагимова Амина"
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
									disabled={parentLocked}
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
									onChange={(value) => {
										field.onChange(value)
										setValue('levelId', undefined)
										setValue('localStepIndex', 0)
									}}
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
									loading={levelsLoading}
									disabled={!groupId || levelsLoading}
									options={levels.map((level) => ({
										value: level.id,
										label: `Уровень ${level.number}: ${level.title}`,
									}))}
									placeholder={
										groupId ? 'Выберите уровень' : 'Сначала выберите группу'
									}
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
