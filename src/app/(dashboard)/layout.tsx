import { redirect } from 'next/navigation'

import { AppShell } from '@/widgets/app-shell'
import { auth } from '@/shared/lib/auth'

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await auth()
	if (!session) redirect('/login')

	return <AppShell>{children}</AppShell>
}
