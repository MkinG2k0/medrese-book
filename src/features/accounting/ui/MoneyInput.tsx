'use client'

import { Input } from 'antd'
import { useMemo } from 'react'

import { formatMoney, parseMoneyInput } from '@/shared/lib/money'

type MoneyInputProps = {
	valueKopecks: number | null
	onChangeKopecks: (value: number | null) => void
	placeholder?: string
}

export function MoneyInput({
	valueKopecks,
	onChangeKopecks,
	placeholder = '0',
}: MoneyInputProps) {
	const displayValue = useMemo(() => {
		if (valueKopecks == null) return ''
		return String(valueKopecks / 100).replace('.', ',')
	}, [valueKopecks])

	return (
		<Input
			inputMode="decimal"
			placeholder={placeholder}
			value={displayValue}
			onChange={(event) => {
				const parsed = parseMoneyInput(event.target.value)
				onChangeKopecks(parsed)
			}}
			suffix={valueKopecks != null ? formatMoney(valueKopecks) : undefined}
		/>
	)
}
