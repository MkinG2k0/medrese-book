import { redirect } from 'next/navigation'

import { getSwitchableUsers } from '@/features/auth/actions/switch-user-actions'
import {
	getSubstitutionHeaderInfo,
	getSubstitutionTargetUserIds,
	isTeacherActivelySubstituting,
} from '@/features/auth/lib/get-substitution-header-info'
import { prisma } from '@/shared/lib/prisma'
import { getCachedAuth } from '@/shared/lib/session'
import type { StudentStatus } from '@/shared/lib/student-status'
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
		studentStatus,
	] = await Promise.all([
		getSwitchableUsers(),
		getSubstitutionHeaderInfo(session),
		isTeacherActivelySubstituting(session),
		getSubstitutionTargetUserIds(session),
		session.user.role === 'STUDENT' && session.user.studentId
			? prisma.student
					.findUnique({
						where: { id: session.user.studentId },
						select: { status: true },
					})
					.then((row) => (row?.status as StudentStatus | undefined) ?? null)
			: Promise.resolve(null),
	])

	return (
		<AppShell
			session={session}
			switchableUsers={switchableUsers}
			substitutionHeaderLines={substitutionHeaderLines}
			showSubstitutionRoleLabel={showSubstitutionRoleLabel}
			substitutionTargetUserIds={substitutionTargetUserIds}
			studentStatus={studentStatus}
		>
			{children}
		</AppShell>
	)
}
