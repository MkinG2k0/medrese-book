'use client'

import {
	CheckOutlined,
	ClockCircleOutlined,
	CloseOutlined,
} from '@ant-design/icons'
import { Flex, InputNumber, Modal, Radio, Space } from 'antd'

import { useJournalStore } from '@/features/journal/model/journal-store'

type Attendance = 'PRESENT' | 'LATE' | 'ABSENT'

type AttendanceButtonsProps = {
	value: Attendance
	lateMinutes: number
	onChange: (attendance: Attendance, lateMinutes?: number) => void
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
	onChange,
	disabled = false,
	gradedStepCount,
	onClearCompletions,
}: AttendanceButtonsProps) {
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
			Modal.confirm({
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
		<Flex vertical gap={12}>
			<Radio.Group
				value={value}
				onChange={(e) => handleAttendanceSelect(e.target.value)}
				className="w-full"
				disabled={disabled}
			>
				<Flex gap={8} className="w-full">
					{OPTIONS.map((opt) => (
						<Radio.Button
							key={opt.value}
							value={opt.value}
							className="flex-1 text-center"
						>
							<Flex align="center" justify="center" gap={6}>
								{opt.icon}
								{opt.label}
							</Flex>
						</Radio.Button>
					))}
				</Flex>
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
		</Flex>
	)
}
