import type { JSONContent } from '@tiptap/core'

import type { ContentBlock, StepContent } from '@/shared/lib/validations/step'

export function tiptapToStepContent(json: JSONContent): StepContent {
	const blocks: ContentBlock[] = []

	for (const node of json.content ?? []) {
		if (node.type === 'paragraph') {
			const text = node.content?.map((c) => c.text ?? '').join('') ?? ''
			if (text) blocks.push({ type: 'text', value: text })
		} else if (node.type === 'heading') {
			const text = node.content?.map((c) => c.text ?? '').join('') ?? ''
			if (text) blocks.push({ type: 'text', value: text })
		} else if (node.type === 'bulletList') {
			const items =
				node.content?.map((li) =>
					li.content?.[0]?.content?.map((c) => c.text ?? '').join('') ?? '',
				) ?? []
			blocks.push({ type: 'list', items })
		} else if (node.type === 'image') {
			blocks.push({
				type: 'image',
				url: (node.attrs?.src as string) ?? '',
				caption: node.attrs?.alt as string | undefined,
			})
		} else if (node.type === 'arabicBlock') {
			blocks.push({
				type: 'arabic',
				value: (node.attrs?.value as string) ?? '',
				size: (node.attrs?.size as 'md' | 'lg' | 'xl') ?? 'lg',
			})
		}
	}

	return { blocks }
}

export function stepContentToTiptap(content: StepContent): JSONContent {
	const contentNodes: JSONContent[] = content.blocks.map((block) => {
		switch (block.type) {
			case 'text':
				return {
					type: 'paragraph',
					content: [{ type: 'text', text: block.value }],
				}
			case 'arabic':
				return {
					type: 'arabicBlock',
					attrs: { value: block.value, size: block.size ?? 'lg' },
				}
			case 'image':
				return {
					type: 'image',
					attrs: { src: block.url, alt: block.caption ?? '' },
				}
			case 'list':
				return {
					type: 'bulletList',
					content: block.items.map((item) => ({
						type: 'listItem',
						content: [
							{
								type: 'paragraph',
								content: [{ type: 'text', text: item }],
							},
						],
					})),
				}
			default:
				return { type: 'paragraph' }
		}
	})

	return { type: 'doc', content: contentNodes }
}
