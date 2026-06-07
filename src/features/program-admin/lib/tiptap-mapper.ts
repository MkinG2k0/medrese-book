import type { JSONContent } from '@tiptap/core'

import type { ContentBlock, StepContent } from '@/shared/lib/validations/step'

function serializeInlineNode(node: JSONContent): string {
	if (node.type === 'hardBreak') return '<br>'

	let text = node.text ?? ''
	for (const mark of node.marks ?? []) {
		if (mark.type === 'bold') text = `<strong>${text}</strong>`
		if (mark.type === 'italic') text = `<em>${text}</em>`
	}
	return text
}

function serializeInlineContent(nodes: JSONContent[] | undefined): string {
	return (nodes ?? []).map(serializeInlineNode).join('')
}

function parseInlineHtml(html: string): JSONContent[] {
	if (!html) return []
	if (!/<[^>]+>/.test(html)) {
		return [{ type: 'text', text: html }]
	}

	const nodes: JSONContent[] = []
	const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')

	const walk = (node: globalThis.Node, marks: { type: string }[] = []) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? ''
			if (text) {
				nodes.push({
					type: 'text',
					text,
					...(marks.length > 0 ? { marks: [...marks] } : {}),
				})
			}
			return
		}

		if (node.nodeName === 'BR') {
			nodes.push({ type: 'hardBreak' })
			return
		}

		const nextMarks = [...marks]
		if (node.nodeName === 'STRONG' || node.nodeName === 'B') {
			nextMarks.push({ type: 'bold' })
		}
		if (node.nodeName === 'EM' || node.nodeName === 'I') {
			nextMarks.push({ type: 'italic' })
		}

		node.childNodes.forEach((child) => walk(child, nextMarks))
	}

	doc.body.firstElementChild?.childNodes.forEach((child) => walk(child))
	return nodes.length > 0 ? nodes : [{ type: 'text', text: html }]
}

function parseTextBlock(value: string): JSONContent {
	const headingMatch = value.match(/^<h([1-6])>([\s\S]*)<\/h\1>$/)
	if (headingMatch) {
		return {
			type: 'heading',
			attrs: { level: Number(headingMatch[1]) },
			content: parseInlineHtml(headingMatch[2]),
		}
	}

	return {
		type: 'paragraph',
		content: parseInlineHtml(value),
	}
}

export function tiptapToStepContent(json: JSONContent): StepContent {
	const blocks: ContentBlock[] = []

	for (const node of json.content ?? []) {
		if (node.type === 'paragraph') {
			const text = serializeInlineContent(node.content)
			if (text) blocks.push({ type: 'text', value: text })
		} else if (node.type === 'heading') {
			const level = (node.attrs?.level as number) ?? 2
			const text = serializeInlineContent(node.content)
			if (text) blocks.push({ type: 'text', value: `<h${level}>${text}</h${level}>` })
		} else if (node.type === 'bulletList' || node.type === 'orderedList') {
			const items =
				node.content?.map((li) =>
					serializeInlineContent(li.content?.[0]?.content),
				) ?? []
			if (items.some(Boolean)) blocks.push({ type: 'list', items })
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
				return parseTextBlock(block.value)
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
								content: parseInlineHtml(item),
							},
						],
					})),
				}
			default:
				return { type: 'paragraph' }
		}
	})

	if (contentNodes.length === 0) {
		contentNodes.push({ type: 'paragraph' })
	}

	return { type: 'doc', content: contentNodes }
}
