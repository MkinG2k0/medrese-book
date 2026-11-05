'use client'

import { Select, Tag } from 'antd'

import type { ParentMonthOption } from '@/features/parent-portal/lib/unpaid-months'

interface ParentMonthSelectProps {
	value: string | null
	options: ParentMonthOption[]
	onChange: (month: string) => void
	className?: string
}

export function ParentMonthSelect({
	value,
	options,
	onChange,
	className,
}: ParentMonthSelectProps) {
	return (
		<Select
			className={className}
			value={value}
			options={options}
			placeholder="Выберите месяц"
			onChange={onChange}
			aria-label="Месяц оплаты"
			optionRender={(option) => (
				<div className="flex items-center justify-between gap-2">
					<span>{option.data.label}</span>
					{option.data.unpaid ? (
						<Tag color="gold">Не оплачен</Tag>
					) : null}
				</div>
			)}
		/>
	)
}
