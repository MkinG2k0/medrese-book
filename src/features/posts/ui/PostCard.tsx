'use client'

import { DeleteOutlined, LikeFilled, LikeOutlined } from '@ant-design/icons'
import { App, Button, Card } from 'antd'

import type { PostDto } from '@/entities/post'
import { useDeletePost, useTogglePostLike } from '@/entities/post'
import { PostBodyView } from '@/features/posts/ui/PostBodyView'
import { PostMediaGallery } from '@/features/posts/ui/PostMediaGallery'
import { formatDate } from '@/shared/lib/utils'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

type PostCardProps = {
	post: PostDto
	canDelete?: boolean
}

export function PostCard({ post, canDelete = false }: PostCardProps) {
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
						<Title level={4}>{post.title}</Title>
						<Text type="secondary">
							{post.author.name} · {formatDate(post.publishedAt)}
						</Text>
					</div>
					{canDelete && (
						<Button
							type="text"
							danger
							icon={<DeleteOutlined />}
							aria-label="Удалить"
							onClick={handleDelete}
							loading={deleteMutation.isPending}
						/>
					)}
				</div>

				<PostBodyView content={post.body as Record<string, unknown>} />
				<PostMediaGallery media={post.media} />

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
