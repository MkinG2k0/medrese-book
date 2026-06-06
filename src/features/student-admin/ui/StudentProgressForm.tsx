'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form, Select } from 'antd'
import Link from 'next/link'
import { useEffect, useMemo, useTransition } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { updateStudentProgress } from '@/features/student-admin/actions/student-admin-actions'
import {
	updateStudentProgressSchema,
	type UpdateStudentProgressInput,
} from '@/shared/lib/validations/student-progress'

type LevelOption = {
	id: string
	number: number
	title: string
	steps: { id: string; order: number; title: string }[]
}

type StudentProgressFormProps = {
	studentId: string
	studentName: string
	groupName: string
	levels: LevelOption[]
	initial: UpdateStudentProgressInput
	backHref: string
}

function getStepOffset(levels: LevelOption[], levelNumber: number): number {
	let offset = 0
	for (const level of levels) {
		if (level.number >= levelNumber) break
		offset += level.steps.length
	}
	return offset
}

export function StudentProgressForm({
	studentId,
	studentName,
	groupName,
	levels,
	initial,
	backHref,
}: StudentProgressFormProps) {
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit, setValue } = useForm<UpdateStudentProgressInput>({
		resolver: zodResolver(updateStudentProgressSchema),
		defaultValues: initial,
	})

	const levelId = useWatch({ control, name: 'levelId' })
	const localStepIndex = useWatch({ control, name: 'localStepIndex' })
	const selectedLevel = levels.find((l) => l.id === levelId)

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

	const onSubmit = (values: UpdateStudentProgressInput) => {
		startTransition(async () => {
			await updateStudentProgress(studentId, values)
			window.location.href = backHref
		})
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
			<Form.Item label="Ученик">
				<Select disabled value={studentName} />
			</Form.Item>

			<Form.Item label="Группа">
				<Select disabled value={groupName} />
			</Form.Item>

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
							options={levels.map((l) => ({
								value: l.id,
								label: `Уровень ${l.number}: ${l.title}`,
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

			<div className="flex gap-2">
				<Button type="primary" htmlType="submit" loading={isPending}>
					Сохранить
				</Button>
				<Link href={backHref}>
					<Button>Отмена</Button>
				</Link>
			</div>
		</form>
	)
}
