'use client'

import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button, Space } from 'antd'
import { useEffect } from 'react'

import { ArabicBlock } from '@/features/program-admin/ui/editor/extensions/ArabicBlock'
import {
	stepContentToTiptap,
	tiptapToStepContent,
} from '@/features/program-admin/lib/tiptap-mapper'
import type { StepContent } from '@/shared/lib/validations/step'

type StepEditorProps = {
	initialContent?: StepContent
	onChange: (content: StepContent) => void
}

export function StepEditor({ initialContent, onChange }: StepEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Image,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			ArabicBlock,
		],
		content: initialContent ? stepContentToTiptap(initialContent) : undefined,
		onUpdate: ({ editor: ed }) => {
			onChange(tiptapToStepContent(ed.getJSON()))
		},
		immediatelyRender: false,
	})

	useEffect(() => {
		if (editor && initialContent) {
			editor.commands.setContent(stepContentToTiptap(initialContent))
		}
	}, [editor, initialContent])

	const addArabicBlock = () => {
		const value = window.prompt('Арабский текст:')
		if (!value || !editor) return
		editor
			.chain()
			.focus()
			.insertContent({
				type: 'arabicBlock',
				attrs: { value, size: 'lg' },
			})
			.run()
	}

	const addImage = async () => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.onchange = async () => {
			const file = input.files?.[0]
			if (!file || !editor) return

			const formData = new FormData()
			formData.append('file', file)
			const res = await fetch('/api/uploads', { method: 'POST', body: formData })
			const json = await res.json()
			if (json.data?.url) {
				editor.chain().focus().setImage({ src: json.data.url }).run()
			}
		}
		input.click()
	}

	if (!editor) return null

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-[#2a2622] p-4">
			<Space wrap>
				<Button size="small" onClick={() => editor.chain().focus().toggleBold().run()}>
					Жирный
				</Button>
				<Button size="small" onClick={() => editor.chain().focus().toggleItalic().run()}>
					Курсив
				</Button>
				<Button
					size="small"
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					Заголовок
				</Button>
				<Button size="small" onClick={() => editor.chain().focus().toggleBulletList().run()}>
					Список
				</Button>
				<Button size="small" onClick={addImage}>
					Изображение
				</Button>
				<Button size="small" onClick={addArabicBlock}>
					Арабский блок
				</Button>
			</Space>
			<EditorContent editor={editor} className="min-h-[200px] prose-invert" />
		</div>
	)
}
