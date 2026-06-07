import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { ArabicBlockView } from '@/features/program-admin/ui/editor/ArabicBlockView'

export const ArabicBlock = Node.create({
	name: 'arabicBlock',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: true,

	addAttributes() {
		return {
			value: { default: '' },
			size: { default: 'lg' },
		}
	},

	parseHTML() {
		return [{ tag: 'div[data-type="arabic-block"]' }]
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'arabic-block',
				dir: 'rtl',
			}),
			HTMLAttributes.value,
		]
	},

	addNodeView() {
		return ReactNodeViewRenderer(ArabicBlockView)
	},
})
