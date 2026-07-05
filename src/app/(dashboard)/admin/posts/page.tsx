import { PostsAdminPage } from '@/features/posts'
import { requireRoles } from '@/shared/lib/session'

export default async function AdminPostsPage() {
	await requireRoles(['MANAGER', 'SUPER_ADMIN'])
	return <PostsAdminPage />
}
