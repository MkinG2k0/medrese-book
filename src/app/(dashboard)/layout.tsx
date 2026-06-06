import { redirect } from 'next/navigation'

import { getSwitchableUsers } from '@/features/auth/actions/switch-user-actions'
import { auth } from '@/shared/lib/auth'
import { AppShell } from '@/widgets/app-shell'

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await auth()
	if (!session) redirect('/login')

	const switchableUsers = await getSwitchableUsers()

	return (
		<AppShell session={session} switchableUsers={switchableUsers}>
			{children}
		</AppShell>
	)
}
