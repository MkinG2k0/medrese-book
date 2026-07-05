import { NewsFeedPage } from '@/features/posts'
import { requireAuth } from '@/shared/lib/session'

export default async function NewsPage() {
	await requireAuth()
	return <NewsFeedPage />
}
