'use client'

import { Input, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'

type ArabicBlockModalProps = {
	open: boolean
	initialValue?: string
	initialSize?: 'md' | 'lg' | 'xl'
	onConfirm: (value: string, size: 'md' | 'lg' | 'xl') => void
	onCancel: () => void
}

export function ArabicBlockModal({
	open,
	initialValue = '',
	initialSize = 'lg',
	onConfirm,
	onCancel,
}: ArabicBlockModalProps) {
	const [value, setValue] = useState(initialValue)
	const [size, setSize] = useState<'md' | 'lg' | 'xl'>(initialSize)

	useEffect(() => {
		if (open) {
			setValue(initialValue)
			setSize(initialSize)
		}
	}, [open, initialValue, initialSize])

	return (
		<Modal
			title="Арабский блок"
			open={open}
			okText="Вставить"
			cancelText="Отмена"
			okButtonProps={{ disabled: !value.trim() }}
			onOk={() => onConfirm(value.trim(), size)}
			onCancel={onCancel}
			destroyOnHidden
		>
			<div className="flex flex-col gap-4 pt-2">
				<div>
					<label className="mb-1 block">Текст</label>
					<Input.TextArea
						value={value}
						onChange={(e) => setValue(e.target.value)}
						rows={3}
						dir="rtl"
						placeholder="أدخل النص العربي"
						className="font-[family-name:var(--font-arabic)]"
						autoFocus
					/>
				</div>
				<div>
					<label className="mb-1 block">Размер</label>
					<Select
						className="w-full"
						value={size}
						onChange={setSize}
						options={[
							{ value: 'md', label: 'Средний' },
							{ value: 'lg', label: 'Большой' },
							{ value: 'xl', label: 'Очень большой' },
						]}
					/>
				</div>
				{value.trim() && (
					<div
						dir="rtl"
						className={`rounded-lg border border-[#2a2622] bg-[#1a1816] p-4 font-[family-name:var(--font-arabic)] text-[#e8e0d0] ${
							size === 'xl' ? 'text-4xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'
						}`}
					>
						{value}
					</div>
				)}
			</div>
		</Modal>
	)
}
