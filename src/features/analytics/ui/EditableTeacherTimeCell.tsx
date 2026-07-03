'use client'

import { App, TimePicker } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import {
	clearTeacherLessonTime,
	updateTeacherLessonTime,
} from '@/features/analytics/actions/teacher-lessons-actions'
import type { TeacherLessonTimeField } from '@/shared/lib/validations/teacher-lesson-time'

const FIELD_LABELS: Record<TeacherLessonTimeField, string> = {
	login: 'время прихода',
	logout: 'время ухода',
	lessonStart: 'начало урока',
	lessonEnd: 'конец урока',
}

type EditableTeacherTimeCellProps = {
	teacherId: string
	date: string
	field: TeacherLessonTimeField
	value: string | null
}

export function EditableTeacherTimeCell({
	teacherId,
	date,
	field,
	value,
}: EditableTeacherTimeCellProps) {
	const { message, modal } = App.useApp()
	const router = useRouter()
	const [pending, startTransition] = useTransition()

	const saveTime = (time: string) => {
		startTransition(async () => {
			const result = await updateTeacherLessonTime({
				teacherId,
				date,
				field,
				time,
			})

			if (!result.ok) {
				message.error(result.error)
				return
			}

			message.success('Время сохранено')
			router.refresh()
		})
	}

	const confirmClear = () => {
		modal.confirm({
			title: 'Удалить время?',
			content: `Удалить ${FIELD_LABELS[field]} за этот день?`,
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				const result = await clearTeacherLessonTime({
					teacherId,
					date,
					field,
				})

				if (!result.ok) {
					message.error(result.error)
					throw new Error(result.error)
				}

				message.success('Время удалено')
				router.refresh()
			},
		})
	}

	return (
		<TimePicker
			size="small"
			format="HH:mm"
			variant="borderless"
			allowClear={Boolean(value)}
			placeholder="—"
			className="min-w-[4.5rem] cursor-pointer"
			value={value ? dayjs(value, 'HH:mm') : null}
			disabled={pending}
			onChange={(time) => {
				if (!time) {
					if (value) confirmClear()
					return
				}

				saveTime(time.format('HH:mm'))
			}}
		/>
	)
}
