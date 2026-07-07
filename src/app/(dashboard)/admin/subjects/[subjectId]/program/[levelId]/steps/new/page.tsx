import { StepForm } from '@/features/program-admin/ui/StepForm'
import { requireRoles } from '@/shared/lib/session'
import Title from '@/shared/ui/Title'

type Props = {
	params: Promise<{ subjectId: string; levelId: string }>
}

export default async function NewSubjectStepPage({ params }: Props) {
	await requireRoles(['SUPER_ADMIN', 'MANAGER'])
	const { subjectId, levelId } = await params

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
			<Title level={3}>Новый шаг</Title>
			<StepForm subjectId={subjectId} levelId={levelId} />
		</div>
	)
}
