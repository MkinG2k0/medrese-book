import { redirect } from 'next/navigation'

import { getSwitchableUsers } from '@/features/auth/actions/switch-user-actions'
import { getCachedAuth } from '@/shared/lib/session'
import { AppShell } from '@/widgets/app-shell'

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getCachedAuth()
	if (!session) redirect('/login')

	const switchableUsers = await getSwitchableUsers()

	return (
		<AppShell session={session} switchableUsers={switchableUsers}>
			{children}
		</AppShell>
	)
}
