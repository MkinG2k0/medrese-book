import { redirect } from 'next/navigation'

import { getSwitchableUsers } from '@/features/auth/actions/switch-user-actions'
import {
	getSubstitutionHeaderInfo,
	getSubstitutionTargetUserIds,
	isTeacherActivelySubstituting,
} from '@/features/auth/lib/get-substitution-header-info'
import { getCachedAuth } from '@/shared/lib/session'
import { AppShell } from '@/widgets/app-shell'

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getCachedAuth()
	if (!session) redirect('/login')

	const [
		switchableUsers,
		substitutionHeaderLines,
		showSubstitutionRoleLabel,
		substitutionTargetUserIds,
	] = await Promise.all([
		getSwitchableUsers(),
		getSubstitutionHeaderInfo(session),
		isTeacherActivelySubstituting(session),
		getSubstitutionTargetUserIds(session),
	])

	return (
		<AppShell
			session={session}
			switchableUsers={switchableUsers}
			substitutionHeaderLines={substitutionHeaderLines}
			showSubstitutionRoleLabel={showSubstitutionRoleLabel}
			substitutionTargetUserIds={substitutionTargetUserIds}
		>
			{children}
		</AppShell>
	)
}
