'use client'

import {
	CheckOutlined,
	ClockCircleOutlined,
	CloseOutlined,
} from '@ant-design/icons'
import { App, Checkbox, Input, InputNumber, Radio, Space } from 'antd'

import { useJournalStore } from '@/features/journal/model/journal-store'

type Attendance = 'PRESENT' | 'LATE' | 'ABSENT'

type AttendanceButtonsProps = {
	value: Attendance
	lateMinutes: number
	absenceExcused: boolean
	absenceReason: string
	onChange: (
		attendance: Attendance,
		lateMinutes?: number,
		absence?: { excused: boolean; reason: string },
	) => void
	disabled?: boolean
	gradedStepCount: number
	onClearCompletions: () => void
}

const OPTIONS: { value: Attendance; label: string; icon: React.ReactNode }[] = [
	{ value: 'PRESENT', label: 'Пришёл', icon: <CheckOutlined /> },
	{ value: 'LATE', label: 'Опоздал', icon: <ClockCircleOutlined /> },
	{ value: 'ABSENT', label: 'Прогул', icon: <CloseOutlined /> },
]

export function AttendanceButtons({
	value,
	lateMinutes,
	absenceExcused,
	absenceReason,
	onChange,
	disabled = false,
	gradedStepCount,
	onClearCompletions,
}: AttendanceButtonsProps) {
	const { modal } = App.useApp()
	const setPendingAbsentConfirm = useJournalStore(
		(store) => store.setPendingAbsentConfirm,
	)

	const handleAttendanceSelect = (newValue: Attendance) => {
		if (
			newValue === 'ABSENT' &&
			value !== 'ABSENT' &&
			gradedStepCount > 0
		) {
			setPendingAbsentConfirm(true)
			modal.confirm({
				title: 'Подтвердите прогул',
				content: `Вы выставили оценки за ${gradedStepCount} шагов. При прогуле они будут удалены. Продолжить?`,
				okText: 'Да, прогул',
				cancelText: 'Отмена',
				onOk: () => {
					onClearCompletions()
					onChange('ABSENT')
					setPendingAbsentConfirm(false)
				},
				onCancel: () => {
					setPendingAbsentConfirm(false)
				},
			})
			return
		}

		onChange(newValue)
	}

	return (
		<div className="flex flex-col gap-3">
			<Radio.Group
				value={value}
				onChange={(e) => handleAttendanceSelect(e.target.value)}
				className="w-full"
				disabled={disabled}
			>
				<div className="flex w-full gap-2">
					{OPTIONS.map((opt) => (
						<Radio.Button
							key={opt.value}
							value={opt.value}
							className="flex-1 text-center"
						>
							<span className="flex items-center justify-center gap-1.5">
								{opt.icon}
								{opt.label}
							</span>
						</Radio.Button>
					))}
				</div>
			</Radio.Group>
			{value === 'LATE' && (
				<Space.Compact block className="w-full">
					<InputNumber
						min={1}
						max={120}
						value={lateMinutes}
						onChange={(v) => onChange('LATE', v ?? 5)}
						style={{ width: '100%' }}
						disabled={disabled}
					/>
					<Space.Addon>мин</Space.Addon>
				</Space.Compact>
			)}
			{value === 'ABSENT' && (
				<div className="flex flex-col gap-2">
					<Checkbox
						checked={absenceExcused}
						disabled={disabled}
						onChange={(e) =>
							onChange('ABSENT', undefined, {
								excused: e.target.checked,
								reason: absenceReason,
							})
						}
					>
						Уважительная причина
					</Checkbox>
					<Input.TextArea
						value={absenceReason}
						disabled={disabled}
						placeholder="Причина пропуска (необязательно)"
						rows={2}
						onChange={(e) =>
							onChange('ABSENT', undefined, {
								excused: absenceExcused,
								reason: e.target.value,
							})
						}
					/>
				</div>
			)}
		</div>
	)
}
