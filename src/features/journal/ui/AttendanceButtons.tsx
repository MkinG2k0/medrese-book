'use client'

import { Button, InputNumber, Space } from 'antd'

type Attendance = 'PRESENT' | 'LATE' | 'ABSENT'

type AttendanceButtonsProps = {
	value: Attendance
	lateMinutes: number
	onChange: (attendance: Attendance, lateMinutes?: number) => void
}

export function AttendanceButtons({
	value,
	lateMinutes,
	onChange,
}: AttendanceButtonsProps) {
	return (
		<div className="flex flex-col gap-2">
			<Space wrap>
				<Button
					type={value === 'PRESENT' ? 'primary' : 'default'}
					onClick={() => onChange('PRESENT')}
				>
					Присутствует
				</Button>
				<Button
					type={value === 'LATE' ? 'primary' : 'default'}
					onClick={() => onChange('LATE')}
				>
					Опоздал
				</Button>
				<Button
					type={value === 'ABSENT' ? 'primary' : 'default'}
					danger={value === 'ABSENT'}
					onClick={() => onChange('ABSENT')}
				>
					Прогул
				</Button>
			</Space>
			{value === 'LATE' && (
				<InputNumber
					min={1}
					max={120}
					value={lateMinutes}
					onChange={(v) => onChange('LATE', v ?? 5)}
					addonAfter="мин"
				/>
			)}
		</div>
	)
}
