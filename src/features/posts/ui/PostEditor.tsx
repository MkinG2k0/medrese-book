'use client'

import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useState } from 'react'

import { PostEditorToolbar } from '@/features/posts/ui/PostEditorToolbar'
import type { CreatePostInput } from '@/shared/lib/validations/post'
import '@/features/program-admin/ui/editor/step-editor.css'

const EMPTY_DOC: CreatePostInput['body'] = {
	type: 'doc',
	content: [{ type: 'paragraph' }],
}

type PostEditorProps = {
	initialContent?: CreatePostInput['body']
	onChange: (content: CreatePostInput['body']) => void
}

export function PostEditor({ initialContent, onChange }: PostEditorProps) {
	const [toolbarRevision, setToolbarRevision] = useState(0)

	const bumpToolbar = useCallback(() => {
		setToolbarRevision((revision) => revision + 1)
	}, [])

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
			Placeholder.configure({
				placeholder: 'Описание новости…',
			}),
		],
		content: initialContent ?? EMPTY_DOC,
		editorProps: {
			attributes: {
				class: 'step-editor-content',
			},
		},
		onUpdate: ({ editor: currentEditor }) => {
			onChange(currentEditor.getJSON() as CreatePostInput['body'])
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

	if (!editor) return null

	void toolbarRevision

	return (
		<div className="step-editor">
			<PostEditorToolbar editor={editor} onImageClick={addImage} />
			<EditorContent editor={editor} />
		</div>
	)
}

export function getEmptyPostBody(): CreatePostInput['body'] {
	return EMPTY_DOC
}
