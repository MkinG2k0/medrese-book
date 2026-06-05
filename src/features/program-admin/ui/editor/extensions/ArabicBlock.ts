import { mergeAttributes, Node } from '@tiptap/core'

export const ArabicBlock = Node.create({
	name: 'arabicBlock',
	group: 'block',
	atom: true,

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
				style: 'font-family: Amiri, serif',
			}),
			HTMLAttributes.value,
		]
	},
})
