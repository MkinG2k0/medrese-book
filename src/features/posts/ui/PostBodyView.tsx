'use client'

import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import '@/features/program-admin/ui/editor/step-editor.css'

type PostBodyViewProps = {
	content: Record<string, unknown>
}

export function PostBodyView({ content }: PostBodyViewProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3] },
			}),
			Image.configure({
				inline: false,
				allowBase64: false,
			}),
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
		],
		content,
		editable: false,
		immediatelyRender: false,
	})

	if (!editor) return null

	return (
		<div className="step-editor step-editor-readonly">
			<EditorContent editor={editor} />
		</div>
	)
}
