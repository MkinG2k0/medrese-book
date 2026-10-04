import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export const TABLE_SCROLL_X = 'max-content' as const

export function PageRoot({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div className={cn('flex w-full min-w-0 flex-col gap-4 md:gap-6', className)}>
			{children}
		</div>
	)
}

export function PageTitleRow({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				'flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between',
				className,
			)}
		>
			{children}
		</div>
	)
}

export function FilterGrid({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				'grid w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3',
				className,
			)}
		>
			{children}
		</div>
	)
}

export function TableFrame({ children }: { children: ReactNode }) {
	return <div className="min-w-0 max-w-full">{children}</div>
}
