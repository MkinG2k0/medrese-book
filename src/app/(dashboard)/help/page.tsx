import { HelpGuide } from '@/features/help'
import { requireRoles } from '@/shared/lib/session'
import Title from '@/shared/ui/Title'

export default async function HelpPage() {
	const session = await requireRoles(['TEACHER', 'MANAGER', 'SUPER_ADMIN'])
	const role = session.user.role as 'TEACHER' | 'MANAGER' | 'SUPER_ADMIN'

	return (
		<div className="flex flex-col gap-6">
			<Title level={2}>Справка</Title>
			<HelpGuide role={role} />
		</div>
	)
}
