'use client'

import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Button, Form, Input, Modal, Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useSession } from 'next-auth/react'
import { useMemo, useState } from 'react'

import { useCreatePost, usePosts } from '@/entities/post'
import { getEmptyPostBody, PostEditor } from '@/features/posts/ui/PostEditor'
import { PostCard } from '@/features/posts/ui/PostCard'
import type { CreatePostInput } from '@/shared/lib/validations/post'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type MediaUploadItem = UploadFile & {
	mediaType?: 'IMAGE' | 'VIDEO'
	publicUrl?: string
}

export function PostsAdminPage() {
	const { message } = App.useApp()
	const { data: session } = useSession()
	const { data: posts = [], isLoading } = usePosts()
	const createMutation = useCreatePost()

	const [modalOpen, setModalOpen] = useState(false)
	const [title, setTitle] = useState('')
	const [body, setBody] = useState<CreatePostInput['body']>(getEmptyPostBody())
	const [mediaFiles, setMediaFiles] = useState<MediaUploadItem[]>([])
	const [uploading, setUploading] = useState(false)

	const canManage =
		session?.user?.role === 'MANAGER' || session?.user?.role === 'SUPER_ADMIN'

	const resetForm = () => {
		setTitle('')
		setBody(getEmptyPostBody())
		setMediaFiles([])
	}

	const uploadMediaFile = async (file: File): Promise<CreatePostInput['media'][number]> => {
		const formData = new FormData()
		formData.append('file', file)
		const res = await fetch('/api/uploads', { method: 'POST', body: formData })
		const json = await res.json()
		if (json.error) throw new Error(json.error)
		const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
		return { type, url: json.data.url as string }
	}

	const handleSubmit = async () => {
		const trimmedTitle = title.trim()
		if (trimmedTitle.length < 2) {
			message.error('Заголовок не короче 2 символов')
			return
		}

		setUploading(true)
		try {
			const pendingFiles = mediaFiles.filter((item) => item.originFileObj && !item.publicUrl)
			const uploaded: CreatePostInput['media'] = []

			for (const item of pendingFiles) {
				if (!item.originFileObj) continue
				uploaded.push(await uploadMediaFile(item.originFileObj as File))
			}

			const alreadyUploaded = mediaFiles
				.filter((item) => item.publicUrl && item.mediaType)
				.map((item, index) => ({
					type: item.mediaType!,
					url: item.publicUrl!,
					sortOrder: index,
				}))

			await createMutation.mutateAsync({
				title: trimmedTitle,
				body,
				media: [...alreadyUploaded, ...uploaded],
			})

			message.success('Новость опубликована')
			setModalOpen(false)
			resetForm()
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Не удалось опубликовать')
		} finally {
			setUploading(false)
		}
	}

	const sortedPosts = useMemo(
		() => [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
		[posts],
	)

	if (!canManage) {
		return <Text>Нет доступа</Text>
	}

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
			<div className="flex items-center justify-between gap-4">
				<Title level={2}>Управление новостями</Title>
				<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
					Создать
				</Button>
			</div>

			{isLoading ? (
				<Text type="secondary">Загрузка…</Text>
			) : sortedPosts.length === 0 ? (
				<Text type="secondary">Публикаций пока нет</Text>
			) : (
				<div className="flex flex-col gap-4">
					{sortedPosts.map((post) => (
						<PostCard key={post.id} post={post} canDelete />
					))}
				</div>
			)}

			<Modal
				title="Новая публикация"
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false)
					resetForm()
				}}
				onOk={handleSubmit}
				okText="Опубликовать"
				cancelText="Отмена"
				confirmLoading={uploading || createMutation.isPending}
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
						<PostEditor initialContent={body} onChange={setBody} />
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
						<Text type="secondary" className="mt-2 block">
							Изображения и видео сохраняются в S3 (или локально, если S3 не настроен)
						</Text>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
