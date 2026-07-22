'use client'

import { EditOutlined, DeleteOutlined, LikeFilled, LikeOutlined } from '@ant-design/icons'
import { App, Button, Card, Tag } from 'antd'

import type { PostDto } from '@/entities/post'
import { useDeletePost, useTogglePostLike } from '@/entities/post'
import { PostBodyView } from '@/features/posts/ui/PostBodyView'
import { PostMediaGallery } from '@/features/posts/ui/PostMediaGallery'
import { formatDate } from '@/shared/lib/utils'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type PostCardProps = {
	post: PostDto
	canManage?: boolean
	onEdit?: (post: PostDto) => void
}

export function PostCard({ post, canManage = false, onEdit }: PostCardProps) {
	const { modal, message } = App.useApp()
	const likeMutation = useTogglePostLike()
	const deleteMutation = useDeletePost()

	const handleLike = () => {
		likeMutation.mutate(post.id, {
			onError: (err) => message.error(err.message),
		})
	}

	const handleDelete = () => {
		modal.confirm({
			title: 'Удалить публикацию?',
			okText: 'Удалить',
			okType: 'danger',
			cancelText: 'Отмена',
			onOk: async () => {
				await deleteMutation.mutateAsync(post.id)
				message.success('Публикация удалена')
			},
		})
	}

	return (
		<Card>
			<div className="flex flex-col gap-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<Title level={4}>{post.title}</Title>
							{post.type === 'SYSTEM' && <Tag>Системная</Tag>}
						</div>
						<Text type="secondary">
							{post.author.name} · {formatDate(post.publishedAt)}
						</Text>
					</div>
					{canManage && (
						<div className="flex shrink-0 gap-1">
							<Button
								type="text"
								icon={<EditOutlined />}
								aria-label="Редактировать"
								onClick={() => onEdit?.(post)}
							/>
							<Button
								type="text"
								danger
								icon={<DeleteOutlined />}
								aria-label="Удалить"
								onClick={handleDelete}
								loading={deleteMutation.isPending}
							/>
						</div>
					)}
				</div>

				<PostBodyView
					key={`${post.id}-${post.updatedAt}`}
					content={post.body as Record<string, unknown>}
				/>
				<PostMediaGallery
					key={`${post.id}-media-${post.updatedAt}`}
					media={post.media}
				/>

				<div>
					<Button
						type={post.likedByMe ? 'primary' : 'default'}
						icon={post.likedByMe ? <LikeFilled /> : <LikeOutlined />}
						onClick={handleLike}
						loading={likeMutation.isPending}
					>
						{post.likeCount}
					</Button>
				</div>
			</div>
		</Card>
	)
}
