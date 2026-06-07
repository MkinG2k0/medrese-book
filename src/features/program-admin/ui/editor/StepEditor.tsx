'use client'

import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useState } from 'react'

import {
	stepContentToTiptap,
	tiptapToStepContent,
} from '@/features/program-admin/lib/tiptap-mapper'
import { ArabicBlockModal } from '@/features/program-admin/ui/editor/ArabicBlockModal'
import { EditorToolbar } from '@/features/program-admin/ui/editor/EditorToolbar'
import { ArabicBlock } from '@/features/program-admin/ui/editor/extensions/ArabicBlock'
import type { StepContent } from '@/shared/lib/validations/step'

import './step-editor.css'

type StepEditorProps = {
	initialContent?: StepContent
	onChange: (content: StepContent) => void
}

export function StepEditor({ initialContent, onChange }: StepEditorProps) {
	const [toolbarRevision, setToolbarRevision] = useState(0)
	const [arabicModalOpen, setArabicModalOpen] = useState(false)

	const bumpToolbar = useCallback(() => {
		setToolbarRevision((r) => r + 1)
	}, [])

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Image.configure({
				inline: false,
				allowBase64: false,
			}),
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			Placeholder.configure({
				placeholder: 'Начните вводить содержание урока…',
			}),
			ArabicBlock,
		],
		content: initialContent ? stepContentToTiptap(initialContent) : undefined,
		editorProps: {
			attributes: {
				class: 'step-editor-content',
			},
		},
		onUpdate: ({ editor: ed }) => {
			onChange(tiptapToStepContent(ed.getJSON()))
		},
		onSelectionUpdate: bumpToolbar,
		onTransaction: bumpToolbar,
		immediatelyRender: false,
	})

	const addImage = useCallback(() => {
		if (!editor) return

		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.onchange = async () => {
			const file = input.files?.[0]
			if (!file) return

			const formData = new FormData()
			formData.append('file', file)
			const res = await fetch('/api/uploads', { method: 'POST', body: formData })
			const json = await res.json()
			if (json.data?.url) {
				editor.chain().focus().setImage({ src: json.data.url }).run()
			}
		}
		input.click()
	}, [editor])

	const handleArabicConfirm = useCallback(
		(value: string, size: 'md' | 'lg' | 'xl') => {
			if (!editor) return
			editor
				.chain()
				.focus()
				.insertContent({
					type: 'arabicBlock',
					attrs: { value, size },
				})
				.run()
			setArabicModalOpen(false)
		},
		[editor],
	)

	if (!editor) return null

	// toolbarRevision keeps toolbar button active states in sync
	void toolbarRevision

	return (
		<div className="step-editor">
			<EditorToolbar
				editor={editor}
				onImageClick={addImage}
				onArabicClick={() => setArabicModalOpen(true)}
			/>
			<EditorContent editor={editor} />
			<ArabicBlockModal
				open={arabicModalOpen}
				onConfirm={handleArabicConfirm}
				onCancel={() => setArabicModalOpen(false)}
			/>
		</div>
	)
}
