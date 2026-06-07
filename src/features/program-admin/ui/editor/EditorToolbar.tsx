'use client'

import {
	BoldOutlined,
	ItalicOutlined,
	OrderedListOutlined,
	PictureOutlined,
	RedoOutlined,
	UndoOutlined,
	UnorderedListOutlined,
	FontSizeOutlined,
	AlignLeftOutlined,
	AlignCenterOutlined,
	AlignRightOutlined,
} from '@ant-design/icons'
import type { Editor } from '@tiptap/react'
import { Button, Tooltip } from 'antd'

type EditorToolbarProps = {
	editor: Editor
	onImageClick: () => void
	onArabicClick: () => void
}

type ToolbarButtonProps = {
	icon: React.ReactNode
	title: string
	active?: boolean
	disabled?: boolean
	onClick: () => void
}

function ToolbarButton({ icon, title, active, disabled, onClick }: ToolbarButtonProps) {
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

function ToolbarDivider() {
	return <div className="step-editor-toolbar-divider" />
}

export function EditorToolbar({ editor, onImageClick, onArabicClick }: EditorToolbarProps) {
	return (
		<div className="step-editor-toolbar">
			<ToolbarButton
				icon={<UndoOutlined />}
				title="Отменить"
				disabled={!editor.can().undo()}
				onClick={() => editor.chain().focus().undo().run()}
			/>
			<ToolbarButton
				icon={<RedoOutlined />}
				title="Повторить"
				disabled={!editor.can().redo()}
				onClick={() => editor.chain().focus().redo().run()}
			/>

			<ToolbarDivider />

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
				icon={<FontSizeOutlined />}
				title="Заголовок"
				active={editor.isActive('heading', { level: 2 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			/>

			<ToolbarDivider />

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

			<ToolbarDivider />

			<ToolbarButton
				icon={<AlignLeftOutlined />}
				title="По левому краю"
				active={editor.isActive({ textAlign: 'left' })}
				onClick={() => editor.chain().focus().setTextAlign('left').run()}
			/>
			<ToolbarButton
				icon={<AlignCenterOutlined />}
				title="По центру"
				active={editor.isActive({ textAlign: 'center' })}
				onClick={() => editor.chain().focus().setTextAlign('center').run()}
			/>
			<ToolbarButton
				icon={<AlignRightOutlined />}
				title="По правому краю"
				active={editor.isActive({ textAlign: 'right' })}
				onClick={() => editor.chain().focus().setTextAlign('right').run()}
			/>

			<ToolbarDivider />

			<ToolbarButton icon={<PictureOutlined />} title="Изображение" onClick={onImageClick} />
			<ToolbarButton
				icon={<span className="text-sm leading-none">ع</span>}
				title="Арабский блок"
				onClick={onArabicClick}
			/>
		</div>
	)
}
