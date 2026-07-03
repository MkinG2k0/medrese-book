import { redirect } from 'next/navigation'

import { auth } from '@/shared/lib/auth'
import { getDefaultRedirect } from '@/shared/lib/get-default-redirect'

export default async function DashboardPage() {
	const session = await auth()
	if (!session) redirect('/login')

	redirect(getDefaultRedirect(session.user.role))
}
