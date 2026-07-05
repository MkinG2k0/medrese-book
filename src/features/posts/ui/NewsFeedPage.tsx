'use client'

import { usePosts } from '@/entities/post'
import { PostCard } from '@/features/posts/ui/PostCard'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

export function NewsFeedPage() {
	const { data: posts = [], isLoading } = usePosts()

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
			<Title level={2}>Новости</Title>

			{isLoading ? (
				<Text type="secondary">Загрузка…</Text>
			) : posts.length === 0 ? (
				<Text type="secondary">Пока нет публикаций</Text>
			) : (
				<div className="flex flex-col gap-4">
					{posts.map((post) => (
						<PostCard key={post.id} post={post} />
					))}
				</div>
			)}
		</div>
	)
}
