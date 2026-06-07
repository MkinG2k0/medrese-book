import { ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

type StudentSelectOptionProps = {
	name: string
	stepNumber: number
	absences: number
	lateCount: number
}

export function StudentSelectOption({
	name,
	stepNumber,
	absences,
	lateCount,
}: StudentSelectOptionProps) {
	return (
		<div className="flex items-center justify-between gap-3 py-0.5">
			<span className="min-w-0 flex-1 truncate">{name}</span>
			<div className="flex shrink-0 items-center gap-1.5">
				<Tag>Шаг {stepNumber}</Tag>
				{absences > 0 && (
					<Tag color="red" icon={<CloseCircleOutlined />}>
						{absences}
					</Tag>
				)}
				{lateCount > 0 && (
					<Tag color="orange" icon={<ClockCircleOutlined />}>
						{lateCount}
					</Tag>
				)}
			</div>
		</div>
	)
}
