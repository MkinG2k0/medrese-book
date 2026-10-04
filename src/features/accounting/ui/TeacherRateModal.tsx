'use client'

import { App, Button, DatePicker, Form, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import {
	getTeacherRateView,
	setTeacherRate,
	type TeacherRateView,
} from '@/features/accounting/actions/teacher-rate-actions'
import { TeacherRateHistory } from '@/features/accounting/ui/TeacherRateHistory'
import { MoneyInput } from '@/features/accounting/ui/MoneyInput'
import {
	getLocalDateString,
	isPastCalendarDay,
} from '@/shared/lib/calendar-date'

type TeacherRateModalProps = {
	open: boolean
	teacherId: string | null
	teacherName: string
	onClose: () => void
}

export function TeacherRateModal({
	open,
	teacherId,
	teacherName,
	onClose,
}: TeacherRateModalProps) {
	const { message } = App.useApp()
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const [view, setView] = useState<TeacherRateView | null>(null)
	const [hourlyRateKopecks, setHourlyRateKopecks] = useState<number | null>(null)
	const [validFrom, setValidFrom] = useState(getLocalDateString())

	useEffect(() => {
		if (!open || !teacherId) {
			setView(null)
			return
		}

		let cancelled = false
		getTeacherRateView(teacherId)
			.then((result) => {
				if (cancelled) return
				setView(result)
				setHourlyRateKopecks(result?.current?.hourlyRateKopecks ?? null)
				setValidFrom(getLocalDateString())
			})
			.catch(() => {
				if (!cancelled) message.error('Не удалось загрузить ставки')
			})

		return () => {
			cancelled = true
		}
	}, [open, teacherId, message])

	const handleSave = () => {
		if (!teacherId) return
		if (hourlyRateKopecks == null) {
			message.error('Укажите ставку')
			return
		}

		startTransition(async () => {
			const result = await setTeacherRate({
				teacherId,
				hourlyRateKopecks,
				validFrom,
			})
			if (!result.ok) {
				message.error(result.error)
				return
			}

			message.success('Ставка сохранена')
			const refreshed = await getTeacherRateView(teacherId)
			setView(refreshed)
			setHourlyRateKopecks(refreshed?.current?.hourlyRateKopecks ?? hourlyRateKopecks)
			router.refresh()
		})
	}

	return (
		<Modal
			title={`Ставка — ${teacherName}`}
			open={open}
			onCancel={onClose}
			footer={null}
			width={640}
			destroyOnHidden
		>
			<div className="flex flex-col gap-6">
				<Form layout="vertical">
					<Form.Item label="Почасовая ставка" required>
						<MoneyInput
							valueKopecks={hourlyRateKopecks}
							onChangeKopecks={setHourlyRateKopecks}
							placeholder="0"
							ariaLabel="Почасовая ставка"
						/>
					</Form.Item>
					<Form.Item label="Действует с" required>
						<DatePicker
							value={dayjs(validFrom)}
							allowClear={false}
							inputReadOnly
							format="DD.MM.YYYY"
							className="w-full"
							disabledDate={(current) =>
								current != null &&
								isPastCalendarDay(current.format('YYYY-MM-DD'))
							}
							onChange={(value) => {
								if (value) setValidFrom(value.format('YYYY-MM-DD'))
							}}
						/>
					</Form.Item>
					<Button type="primary" loading={pending} onClick={handleSave}>
						Сохранить ставку
					</Button>
				</Form>

				<TeacherRateHistory
					current={view?.current ?? null}
					history={view?.history ?? []}
				/>
			</div>
		</Modal>
	)
}
