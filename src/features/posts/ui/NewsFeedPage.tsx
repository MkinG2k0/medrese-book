'use client'

import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Button, Form, Input, Modal, Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useSession } from 'next-auth/react'
import { useMemo, useState } from 'react'

import type { PostDto } from '@/entities/post'
import { useCreatePost, usePosts, useUpdatePost } from '@/entities/post'
import { getEmptyPostBody, PostEditor } from '@/features/posts/ui/PostEditor'
import { PostCard } from '@/features/posts/ui/PostCard'
import type { CreatePostInput } from '@/shared/lib/validations/post'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type MediaUploadItem = UploadFile & {
	mediaType?: 'IMAGE' | 'VIDEO'
	publicUrl?: string
}

function inferMediaType(item: MediaUploadItem): 'IMAGE' | 'VIDEO' {
	if (item.mediaType) return item.mediaType
	if (item.type?.startsWith('video/')) return 'VIDEO'
	const name = item.name?.toLowerCase() ?? item.url?.toLowerCase() ?? ''
	if (/\.(mp4|webm|mov|m4v|avi)(\?|$)/.test(name)) return 'VIDEO'
	return 'IMAGE'
}

function resolveMediaUrl(item: MediaUploadItem): string | null {
	if (item.publicUrl?.startsWith('http')) return item.publicUrl
	if (typeof item.url === 'string') {
		if (item.url.startsWith('http') || item.url.startsWith('/')) return item.url
	}
	return null
}

function mediaToUploadFiles(media: PostDto['media']): MediaUploadItem[] {
	return media.map((item, index) => ({
		uid: item.id,
		name: item.url.split('/').pop() ?? `media-${index}`,
		status: 'done',
		url: item.url,
		publicUrl: item.url,
		mediaType: item.type,
	}))
}

export function NewsFeedPage() {
	const { message } = App.useApp()
	const { data: session } = useSession()
	const { data: posts = [], isLoading } = usePosts()
	const createMutation = useCreatePost()
	const updateMutation = useUpdatePost()

	const [modalOpen, setModalOpen] = useState(false)
	const [editingPost, setEditingPost] = useState<PostDto | null>(null)
	const [title, setTitle] = useState('')
	const [body, setBody] = useState<CreatePostInput['body']>(getEmptyPostBody())
	const [mediaFiles, setMediaFiles] = useState<MediaUploadItem[]>([])
	const [uploading, setUploading] = useState(false)

	const canManage =
		session?.user?.role === 'MANAGER' || session?.user?.role === 'SUPER_ADMIN'

	const isEditing = editingPost !== null

	const resetForm = () => {
		setEditingPost(null)
		setTitle('')
		setBody(getEmptyPostBody())
		setMediaFiles([])
	}

	const openCreateModal = () => {
		resetForm()
		setModalOpen(true)
	}

	const openEditModal = (post: PostDto) => {
		setEditingPost(post)
		setTitle(post.title)
		setBody(post.body as CreatePostInput['body'])
		setMediaFiles(mediaToUploadFiles(post.media))
		setModalOpen(true)
	}

	const closeModal = () => {
		setModalOpen(false)
		resetForm()
	}

	const collectMedia = async (): Promise<CreatePostInput['media']> => {
		const result: CreatePostInput['media'] = []

		for (let index = 0; index < mediaFiles.length; index++) {
			const item = mediaFiles[index]

			if (item.originFileObj && !resolveMediaUrl(item)) {
				const formData = new FormData()
				formData.append('file', item.originFileObj as File)
				const res = await fetch('/api/uploads', { method: 'POST', body: formData })
				const json = await res.json()
				if (json.error) throw new Error(json.error)
				const file = item.originFileObj as File
				result.push({
					type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
					url: json.data.url as string,
					sortOrder: index,
				})
				continue
			}

			const url = resolveMediaUrl(item)
			if (!url) continue

			result.push({
				type: inferMediaType(item),
				url,
				sortOrder: index,
			})
		}

		return result
	}

	const handleSubmit = async () => {
		const trimmedTitle = title.trim()
		if (trimmedTitle.length < 2) {
			message.error('Заголовок не короче 2 символов')
			return
		}

		setUploading(true)
		try {
			const media = await collectMedia()
			const payload = { title: trimmedTitle, body, media, type: 'GENERAL' as const }

			if (isEditing && editingPost) {
				await updateMutation.mutateAsync({ id: editingPost.id, ...payload })
				message.success('Публикация обновлена')
			} else {
				await createMutation.mutateAsync(payload)
				message.success('Новость опубликована')
			}

			closeModal()
		} catch (err) {
			message.error(
				err instanceof Error ? err.message : 'Не удалось сохранить публикацию',
			)
		} finally {
			setUploading(false)
		}
	}

	const sortedPosts = useMemo(
		() => [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
		[posts],
	)

	const editorKey = editingPost?.id ?? 'new'

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
			<div className="flex items-center justify-between gap-4">
				<Title level={2}>Новости</Title>
				{canManage && (
					<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
						Создать
					</Button>
				)}
			</div>

			{isLoading ? (
				<Text type="secondary">Загрузка…</Text>
			) : sortedPosts.length === 0 ? (
				<Text type="secondary">Пока нет публикаций</Text>
			) : (
				<div className="flex flex-col gap-4">
					{sortedPosts.map((post) => (
						<PostCard
							key={post.id}
							post={post}
							canManage={canManage}
							onEdit={openEditModal}
						/>
					))}
				</div>
			)}

			{canManage && (
				<Modal
					title={isEditing ? 'Редактирование публикации' : 'Новая публикация'}
					open={modalOpen}
					onCancel={closeModal}
					onOk={handleSubmit}
					okText={isEditing ? 'Сохранить' : 'Опубликовать'}
					cancelText="Отмена"
					confirmLoading={
						uploading || createMutation.isPending || updateMutation.isPending
					}
					width={720}
					destroyOnHidden
				>
					<Form layout="vertical" className="mt-4">
						<Form.Item label="Заголовок" required>
							<Input
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								maxLength={200}
								placeholder="Заголовок новости"
							/>
						</Form.Item>
						<Form.Item label="Описание" required>
							<PostEditor
								key={editorKey}
								initialContent={body}
								onChange={setBody}
							/>
						</Form.Item>
						<Form.Item label="Фото и видео">
							<Upload
								listType="picture"
								multiple
								accept="image/*,video/*"
								fileList={mediaFiles}
								beforeUpload={() => false}
								onChange={({ fileList }) => setMediaFiles(fileList as MediaUploadItem[])}
							>
								<Button icon={<UploadOutlined />}>Загрузить файлы</Button>
							</Upload>
					
						</Form.Item>
					</Form>
				</Modal>
			)}
		</div>
	)
}
