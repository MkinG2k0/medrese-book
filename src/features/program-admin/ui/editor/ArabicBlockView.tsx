'use client'

import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

export function ArabicBlockView({ node, selected }: NodeViewProps) {
	const value = (node.attrs.value as string) ?? ''
	const size = (node.attrs.size as 'md' | 'lg' | 'xl') ?? 'lg'

	return (
		<NodeViewWrapper className="arabic-block-node" data-selected={selected}>
			<div dir="rtl" className={`arabic-block-inner size-${size}`}>
				{value ? (
					value
				) : (
					<span className="arabic-block-placeholder">Арабский текст</span>
				)}
			</div>
		</NodeViewWrapper>
	)
}
