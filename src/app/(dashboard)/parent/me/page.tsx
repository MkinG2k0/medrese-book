import { getParentChildrenDashboard } from '@/features/parent-portal/actions/parent-actions'
import { ParentChildCard } from '@/features/parent-portal/ui/ParentChildCard'
import { requireRole } from '@/shared/lib/session'
import Text from '@/shared/ui/Text'
import Title from '@/shared/ui/Title'

export default async function ParentMePage() {
	await requireRole('PARENT')
	const dashboard = await getParentChildrenDashboard()

	if (!dashboard) {
		return (
			<div className="flex max-w-3xl flex-col gap-4">
				<Title level={3}>Мои дети</Title>
				<Text type="secondary">Учётка опекуна не найдена.</Text>
			</div>
		)
	}

	return (
		<div className="flex max-w-3xl flex-col gap-6">
			<div className="flex flex-col gap-1">
				<Title level={3}>Мои дети</Title>
				<Text type="secondary">{dashboard.parentName}</Text>
			</div>

			{dashboard.children.length === 0 ? (
				<Text type="secondary">Пока нет привязанных учеников.</Text>
			) : (
				<div className="flex flex-col gap-4">
					{dashboard.children.map((child) => (
						<ParentChildCard
							key={child.studentId}
							name={child.name}
							status={child.status}
							groups={child.groups}
						/>
					))}
				</div>
			)}
		</div>
	)
}
