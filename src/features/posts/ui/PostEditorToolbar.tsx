'use client'

import {
	BoldOutlined,
	ItalicOutlined,
	OrderedListOutlined,
	PictureOutlined,
	UnorderedListOutlined,
} from '@ant-design/icons'
import type { Editor } from '@tiptap/react'
import { Button, Tooltip } from 'antd'

type PostEditorToolbarProps = {
	editor: Editor
	onImageClick: () => void
}

function ToolbarButton({
	icon,
	title,
	active,
	disabled,
	onClick,
}: {
	icon: React.ReactNode
	title: string
	active?: boolean
	disabled?: boolean
	onClick: () => void
}) {
	return (
		<Tooltip title={title}>
			<Button
				type={active ? 'primary' : 'text'}
				size="small"
				icon={icon}
				disabled={disabled}
				onClick={onClick}
				aria-label={title}
			/>
		</Tooltip>
	)
}

export function PostEditorToolbar({ editor, onImageClick }: PostEditorToolbarProps) {
	return (
		<div className="step-editor-toolbar">
			<ToolbarButton
				icon={<BoldOutlined />}
				title="Жирный"
				active={editor.isActive('bold')}
				onClick={() => editor.chain().focus().toggleBold().run()}
			/>
			<ToolbarButton
				icon={<ItalicOutlined />}
				title="Курсив"
				active={editor.isActive('italic')}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			/>
			<ToolbarButton
				icon={<UnorderedListOutlined />}
				title="Маркированный список"
				active={editor.isActive('bulletList')}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			/>
			<ToolbarButton
				icon={<OrderedListOutlined />}
				title="Нумерованный список"
				active={editor.isActive('orderedList')}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			/>
			<ToolbarButton icon={<PictureOutlined />} title="Изображение" onClick={onImageClick} />
		</div>
	)
}
